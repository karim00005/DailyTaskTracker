import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import BatchOperations from '@/components/batch-operations/BatchOperations';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import MainLayout from '@/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';

const ProductBatchOperations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
    refetchOnWindowFocus: false,
  });

  // Define the template columns for product data
  const templateColumns: Record<string, string> = {
    id: 'رقم المنتج',
    name: 'إسم المنتج',
    code: 'الرمز',
    description: 'الوصف',
    category: 'الفئة',
    price: 'السعر',
    cost: 'التكلفة',
    unit: 'الوحدة',
    stock: 'المخزون',
    minStock: 'الحد الأدنى للمخزون',
    maxStock: 'الحد الأقصى للمخزون',
    barcode: 'الباركود',
    image: 'الصورة',
    isActive: 'نشط'
  };

  // Define the fields that can be modified via batch recode
  const fields = [
    { id: 'category', label: 'الفئة' },
    { id: 'unit', label: 'الوحدة' },
    { id: 'minStock', label: 'الحد الأدنى للمخزون' },
    { id: 'maxStock', label: 'الحد الأقصى للمخزون' },
    { id: 'isActive', label: 'نشط' },
    { id: 'description', label: 'الوصف' }
  ];

  const handleBatchCreate = async (data: any[]) => {
    try {
      await apiRequest({
        url: '/api/batch/products/create',
        method: 'POST',
        data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error) {
      console.error('Error in batch create:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء المنتجات',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchUpdate = async (data: any[]) => {
    try {
      await apiRequest({
        url: '/api/batch/products/update',
        method: 'POST',
        data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error) {
      console.error('Error in batch update:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث المنتجات',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchDelete = async (ids: number[]) => {
    try {
      await apiRequest({
        url: '/api/batch/products/delete',
        method: 'POST',
        data: { ids }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error) {
      console.error('Error in batch delete:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف المنتجات',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const handleBatchRecode = async (fieldId: string, newValue: string, ids: number[]) => {
    try {
      await apiRequest({
        url: '/api/batch/products/recode',
        method: 'POST',
        data: {
          fieldId,
          newValue,
          ids
        }
      });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
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
        title="عمليات المنتجات الجماعية" 
        description="قم بإنشاء وتحديث وحذف وعرض المنتجات بشكل جماعي" 
      />
      
      <div className="container mx-auto py-4">
        <BatchOperations
          title="عمليات المنتجات الجماعية"
          description="يمكنك إنشاء، تحديث، حذف أو عرض المنتجات بشكل جماعي"
          entity="المنتجات"
          templateColumns={templateColumns}
          existingData={products}
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

export default ProductBatchOperations;