import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter, FileText, Printer, Download, Upload } from 'lucide-react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

import { useAppContext } from '@/context/AppContext';

function Purchases() {
  const { setCurrentModule } = useAppContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [selectedTab, setSelectedTab] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Set current module on component mount
  useEffect(() => {
    setCurrentModule('purchases');
  }, [setCurrentModule]);

  const { 
    data: invoices = [], 
    isLoading, 
    isError 
  } = useQuery({ 
    queryKey: ['/api/invoices'],
    select: (data) => data.filter((invoice: any) => invoice.invoiceType === 'شراء')
  });

  const handleDateFromChange = (date: Date | undefined) => {
    setDateRange(prev => ({
      ...prev,
      from: date || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }));
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateRange(prev => ({
      ...prev,
      to: date || new Date()
    }));
  };

  const handlePrint = (id: number) => {
    const invoice = invoices.find((inv: any) => inv.id === id);
    if (!invoice) return;
    
    // Implementation for printing invoice
    toast({
      title: "جاري الطباعة",
      description: `تتم طباعة فاتورة المشتريات رقم ${invoice.invoiceNumber}`
    });
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
        toast({
          title: "تم الحذف بنجاح",
          description: "تم حذف الفاتورة بنجاح"
        });
      } else {
        toast({
          title: "فشل الحذف",
          description: "حدث خطأ أثناء حذف الفاتورة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "فشل الحذف",
        description: "حدث خطأ أثناء حذف الفاتورة",
        variant: "destructive"
      });
    }
  };

  // Function to handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/export/excel?type=invoices&invoiceType=شراء');
      if (!response.ok) throw new Error('فشل تصدير البيانات');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'purchase_invoices.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تصدير بيانات فواتير المشتريات بنجاح"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "فشل التصدير",
        description: "حدث خطأ أثناء تصدير البيانات",
        variant: "destructive"
      });
    }
  };

  // Function to get filtered invoices based on tab and search term
  const getFilteredInvoices = () => {
    let filtered = [...invoices];
    
    // Apply tab filter
    if (selectedTab === 'pending') {
      filtered = filtered.filter((invoice: any) => invoice.status === 'معلق');
    } else if (selectedTab === 'completed') {
      filtered = filtered.filter((invoice: any) => invoice.status === 'مكتمل');
    } else if (selectedTab === 'canceled') {
      filtered = filtered.filter((invoice: any) => invoice.status === 'ملغي');
    }
    
    // Apply date range filter
    filtered = filtered.filter((invoice: any) => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
    });
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter((invoice: any) => 
        invoice.invoiceNumber.includes(searchTerm) || 
        (invoice.client && invoice.client.name && invoice.client.name.includes(searchTerm))
      );
    }
    
    // Sort by date descending
    return filtered.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const filteredInvoices = getFilteredInvoices();
  const paginatedInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  const columns = [
    {
      key: 'id',
      header: '#',
      cell: (_: any, index: number) => (page - 1) * pageSize + index + 1
    },
    {
      key: 'invoiceNumber',
      header: 'رقم الفاتورة',
      cell: (row: any) => row.invoiceNumber,
      sortable: true
    },
    {
      key: 'date',
      header: 'التاريخ',
      cell: (row: any) => formatDate(row.date),
      sortable: true
    },
    {
      key: 'supplierName',
      header: 'المورد',
      cell: (row: any) => (row.client ? row.client.name : 'غير محدد'),
      sortable: true
    },
    {
      key: 'total',
      header: 'المبلغ',
      cell: (row: any) => formatCurrency(row.total),
      sortable: true
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (row: any) => {
        const statusColors: Record<string, string> = {
          'معلق': 'bg-yellow-100 text-yellow-800 border-yellow-500',
          'مكتمل': 'bg-green-100 text-green-800 border-green-500',
          'ملغي': 'bg-red-100 text-red-800 border-red-500'
        };
        return (
          <Badge className={`${statusColors[row.status] || ''} border`}>
            {row.status}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'إجراءات',
      cell: (row: any) => (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => navigate(`/purchases/invoice/${row.id}`)}
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => handlePrint(row.id)}
          >
            <Printer className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 text-red-500 hover:text-red-700" 
            onClick={() => handleDelete(row.id)}
          >
            <span className="sr-only">Delete</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="فواتير المشتريات" 
        description="إدارة فواتير المشتريات الخاصة بالموردين"
      />

      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-6">
        <div className="flex items-center w-full md:w-auto space-x-2 space-x-reverse">
          <Button onClick={() => navigate('/purchases/invoice')} className="space-x-2 space-x-reverse">
            <Plus className="h-4 w-4" />
            <span>فاتورة جديدة</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/purchases/batch')}>
            <span>العمليات المجمعة</span>
          </Button>
        </div>

        <div className="flex flex-col md:flex-row w-full md:w-auto space-y-2 md:space-y-0 md:space-x-2 md:space-x-reverse">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              className="pl-3 pr-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2 space-x-reverse">
            <DatePicker 
              date={dateRange.from} 
              setDate={handleDateFromChange} 
              placeholder="من تاريخ" 
              className="w-[140px]"
            />
            <DatePicker 
              date={dateRange.to} 
              setDate={handleDateToChange} 
              placeholder="إلى تاريخ" 
              className="w-[140px]"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 w-10 p-0">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                تصدير Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                طباعة القائمة
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs onValueChange={setSelectedTab} value={selectedTab} className="w-full">
        <TabsList className="w-full md:w-auto mb-4 bg-background">
          <TabsTrigger value="all" className="flex-1 md:flex-none">جميع الفواتير</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 md:flex-none">معلقة</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 md:flex-none">مكتملة</TabsTrigger>
          <TabsTrigger value="canceled" className="flex-1 md:flex-none">ملغية</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedTab} className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-red-500">
              حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد فواتير مشتريات متاحة.
            </div>
          ) : (
            <>
              <DataTable 
                columns={columns} 
                data={paginatedInvoices} 
                className="border rounded-md"
              />
              
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  إجمالي {filteredInvoices.length} فاتورة
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">
                    صفحة {page} من {totalPages || 1}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Purchases;