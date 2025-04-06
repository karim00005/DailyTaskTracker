import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import BatchOperations from '@/components/batch-operations/BatchOperations';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import MainLayout from '@/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';

const ClientBatchOperations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
    refetchOnWindowFocus: false,
  });

  // Define the template columns for client data
  const templateColumns: Record<string, string> = {
    id: 'رقم العميل',
    name: 'إسم العميل',
    code: 'الرمز',
    type: 'النوع',
    accountType: 'نوع الحساب',
    taxId: 'الرقم الضريبي',
    phone: 'الهاتف',
    mobile: 'الجوال',
    email: 'البريد الإلكتروني',
    city: 'المدينة',
    address: 'العنوان',
    notes: 'ملاحظات',
    balance: 'الرصيد',
    isActive: 'نشط'
  };

  // Define the fields that can be modified via batch recode
  const fields = [
    { id: 'type', label: 'النوع' },
    { id: 'accountType', label: 'نوع الحساب' },
    { id: 'city', label: 'المدينة' },
    { id: 'isActive', label: 'نشط' },
    { id: 'notes', label: 'ملاحظات' }
  ];

  const handleBatchCreate = async (data: any[]) => {
    try {
      await apiRequest({
        url: '/api/batch/clients/create',
        method: 'POST',
        data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    } catch (error) {
      console.error('Error in batch create:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء العملاء',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchUpdate = async (data: any[]) => {
    try {
      await apiRequest({
        url: '/api/batch/clients/update',
        method: 'POST',
        data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    } catch (error) {
      console.error('Error in batch update:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث العملاء',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchDelete = async (ids: number[]) => {
    try {
      await apiRequest({
        url: '/api/batch/clients/delete',
        method: 'POST',
        data: { ids }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف العملاء',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchRecode = async (fieldId: string, newValue: string, ids: number[]) => {
    try {
      await apiRequest({
        url: '/api/batch/clients/recode',
        method: 'POST',
        data: {
          fieldId,
          newValue,
          ids
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
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
        title="عمليات العملاء الجماعية" 
        description="قم بإنشاء وتحديث وحذف وعرض العملاء بشكل جماعي" 
      />
      
      <div className="container mx-auto py-4">
        <BatchOperations
          title="عمليات العملاء الجماعية"
          description="يمكنك إنشاء، تحديث، حذف أو عرض العملاء بشكل جماعي"
          entity="العملاء"
          templateColumns={templateColumns}
          existingData={clients}
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

export default ClientBatchOperations;