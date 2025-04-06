import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import BatchOperations from '@/components/batch-operations/BatchOperations';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import MainLayout from '@/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';

const InvoiceBatchOperations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['/api/invoices'],
    refetchOnWindowFocus: false,
  });

  // Define the template columns for invoice data
  const templateColumns: Record<string, string> = {
    id: 'رقم الفاتورة',
    invoiceNumber: 'رقم الفاتورة التسلسلي',
    date: 'التاريخ',
    clientId: 'العميل',
    warehouseId: 'المستودع',
    status: 'الحالة',
    subtotal: 'المجموع الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    shipping: 'الشحن',
    total: 'الإجمالي',
    paid: 'المدفوع',
    due: 'المتبقي',
    notes: 'ملاحظات',
    userId: 'المستخدم'
  };

  // Define the fields that can be modified via batch recode
  const fields = [
    { id: 'status', label: 'الحالة' },
    { id: 'warehouseId', label: 'المخزن' },
    { id: 'notes', label: 'ملاحظات' }
  ];

  const handleBatchCreate = async (data: any[]) => {
    try {
      await apiRequest({
        url: '/api/batch/invoices/create',
        method: 'POST',
        data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    } catch (error) {
      console.error('Error in batch create:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء الفواتير',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchUpdate = async (data: any[]) => {
    try {
      await apiRequest({
        url: '/api/batch/invoices/update',
        method: 'POST',
        data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    } catch (error) {
      console.error('Error in batch update:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الفواتير',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchDelete = async (ids: number[]) => {
    try {
      await apiRequest({
        url: '/api/batch/invoices/delete',
        method: 'POST',
        data: { ids }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الفواتير',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchRecode = async (fieldId: string, newValue: string, ids: number[]) => {
    try {
      await apiRequest({
        url: '/api/batch/invoices/recode',
        method: 'POST',
        data: {
          fieldId,
          newValue,
          ids
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
    } catch (error) {
      console.error('Error in batch recode:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تغيير قيمة الحقل',
        variant: 'destructive'
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Spinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader 
        title="عمليات الفواتير الجماعية" 
        description="قم بإنشاء وتحديث وحذف وعرض الفواتير بشكل جماعي" 
      />
      
      <div className="container mx-auto py-4">
        <BatchOperations
          title="عمليات الفواتير الجماعية"
          description="يمكنك إنشاء، تحديث، حذف أو عرض الفواتير بشكل جماعي"
          entity="الفواتير"
          templateColumns={templateColumns}
          existingData={invoices}
          fields={fields}
          onBatchCreate={handleBatchCreate}
          onBatchUpdate={handleBatchUpdate}
          onBatchDelete={handleBatchDelete}
          onBatchRecode={handleBatchRecode}
        />
      </div>
    </MainLayout>
  );
};

export default InvoiceBatchOperations;