import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/icons";

interface Column<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  footer?: (data: T[]) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  showFooter?: boolean;
  withPagination?: boolean;
  withSearch?: boolean;
  onRowClick?: (row: T) => void;
  isSelectable?: boolean;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  showFooter = false,
  withPagination = false,
  withSearch = false,
  onRowClick,
  isSelectable = false,
  isLoading = false,
  emptyState,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  const itemsPerPage = 10;

  // Filter data based on search term
  const filteredData = withSearch
    ? data.filter((row) => {
        return Object.values(row as Record<string, any>).some((value) => {
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      })
    : data;

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = ((a as Record<string, any>)[sortColumn]) ?? '';
    const bValue = ((b as Record<string, any>)[sortColumn]) ?? '';
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate data
  const paginatedData = withPagination
    ? sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedData;
    
  const totalPages = withPagination ? Math.ceil(sortedData.length / itemsPerPage) : 1;

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    
    const columnKey = column.key.toString();
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleSelectRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === paginatedData.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIndexes = new Set(
        paginatedData.map((_, index) => index)
      );
      setSelectedRows(allIndexes);
    }
    setSelectAll(!selectAll);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded"></div>
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {withSearch && (
        <div className="mb-4">
          <Input
            placeholder="بحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {isSelectable && (
                <TableHead className="w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="form-checkbox"
                  />
                </TableHead>
              )}
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={column.sortable ? "cursor-pointer" : ""}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && sortColumn === column.key && (
                      <span className="mr-1">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (isSelectable ? 1 : 0)}
                  className="h-24 text-center"
                >
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Icon name="search" size={32} className="mb-2 text-gray-400" />
                      <p>لا توجد بيانات للعرض</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {isSelectable && (
                    <TableCell className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(rowIndex);
                        }}
                        className="form-checkbox"
                      />
                    </TableCell>
                  )}
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell
                        ? column.cell(row)
                        : typeof column.key === 'string'
                          ? ((row as Record<string, any>)[column.key] as React.ReactNode)
                          : ((row as Record<string, any>)[column.key.toString()] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
          {showFooter && (
            <tfoot className="bg-gray-50">
              <tr>
                {isSelectable && <td></td>}
                {columns.map((column, index) => (
                  <td key={index} className="px-6 py-3 text-right text-sm font-medium">
                    {column.footer ? column.footer(sortedData) : null}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </Table>
      </div>

      {withPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            عرض {(currentPage - 1) * itemsPerPage + 1} إلى{" "}
            {Math.min(currentPage * itemsPerPage, sortedData.length)} من{" "}
            {sortedData.length} سجل
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <button
              className="btn-gray"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <Icon name="first" size={18} />
            </button>
            <button
              className="btn-gray"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Icon name="prev" size={18} />
            </button>
            <span className="px-3 py-2 text-sm">
              {currentPage} من {totalPages}
            </span>
            <button
              className="btn-gray"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Icon name="next" size={18} />
            </button>
            <button
              className="btn-gray"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <Icon name="last" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
