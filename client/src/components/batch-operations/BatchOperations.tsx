import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLocation } from 'wouter';
import Spinner from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

interface BatchOperationsProps {
  title: string;
  description: string;
  entityName: string;
  entity?: string; // Added for compatibility with existing calls
  operation: 'create' | 'update' | 'delete' | 'recode';
  endpoint: string;
  backUrl: string;
  templateColumns: Record<string, string>;
  requiredColumns?: string[];
  initialData?: any[];
  existingData?: any; // Added for compatibility with existing calls
  fields?: { id: string; label: string; }[]; // Added for compatibility with existing calls
  onBatchCreate?: (data: any[]) => Promise<void>; // Added for compatibility with existing calls
  onBatchUpdate?: (data: any[]) => Promise<void>; // Added for compatibility with existing calls
  onBatchDelete?: (ids: number[]) => Promise<void>; // Added for compatibility with existing calls
  onBatchRecode?: (data: any[]) => Promise<void>; // Added for compatibility with existing calls
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  title,
  description,
  entityName,
  operation,
  endpoint,
  backUrl,
  templateColumns,
  requiredColumns = [],
  initialData = [],
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isBusy, setIsBusy] = useState(false);
  const [data, setData] = useState<any[]>(initialData.length > 0 ? initialData : [{}]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const addRow = () => {
    setData([...data, {}]);
  };

  const removeRow = (index: number) => {
    const newData = [...data];
    newData.splice(index, 1);
    setData(newData.length > 0 ? newData : [{}]);
  };

  const handleColumnChange = (rowIndex: number, columnKey: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnKey]: value,
    };
    setData(newData);

    // Clear error for this field if it exists
    if (errors[`${rowIndex}-${columnKey}`]) {
      const newErrors = { ...errors };
      delete newErrors[`${rowIndex}-${columnKey}`];
      setErrors(newErrors);
    }
  };

  const validateData = () => {
    const newErrors: Record<string, string[]> = {};
    let isValid = true;

    data.forEach((row, rowIndex) => {
      requiredColumns.forEach(columnKey => {
        if (!row[columnKey]) {
          const key = `${rowIndex}-${columnKey}`;
          newErrors[key] = [`${templateColumns[columnKey]} مطلوب`];
          isValid = false;
        }
      });
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateData()) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsBusy(true);
    try {
      // Filter out empty objects
      const filteredData = data.filter(row => Object.keys(row).length > 0);
      const response = await apiRequest(endpoint, 'POST', filteredData);

      toast({
        title: "تمت العملية بنجاح",
        description: `تم تنفيذ عملية الـ${operation} بنجاح`,
      });

      // Redirect back to main page
      navigate(backUrl);
    } catch (error) {
      console.error('Batch operation error:', error);
      toast({
        title: "حدث خطأ",
        description: "حدث خطأ أثناء معالجة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsBusy(false);
    }
  };

  const getOperationTitle = () => {
    switch (operation) {
      case 'create': return `إضافة ${entityName} متعددة`;
      case 'update': return `تعديل ${entityName} متعددة`;
      case 'delete': return `حذف ${entityName} متعددة`;
      case 'recode': return `إعادة ترميز ${entityName}`;
      default: return title;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{getOperationTitle()}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              className="mb-4"
            >
              إضافة صف
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.entries(templateColumns).map(([key, header]) => (
                    <TableHead key={key}>{header}</TableHead>
                  ))}
                  <TableHead className="w-[80px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Object.keys(templateColumns).map((columnKey) => (
                      <TableCell key={`${rowIndex}-${columnKey}`}>
                        <Input
                          placeholder={templateColumns[columnKey]}
                          value={row[columnKey] || ''}
                          onChange={(e) => handleColumnChange(rowIndex, columnKey, e.target.value)}
                          className={errors[`${rowIndex}-${columnKey}`] ? "border-red-500" : ""}
                        />
                        {errors[`${rowIndex}-${columnKey}`] && (
                          <div className="text-xs text-red-500 mt-1">
                            {errors[`${rowIndex}-${columnKey}`].join(', ')}
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        disabled={data.length === 1}
                      >
                        حذف
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(backUrl)}
        >
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isBusy}
        >
          {isBusy ? <><Spinner size="sm" className="mr-2" /> جاري المعالجة...</> : 'حفظ'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchOperations;