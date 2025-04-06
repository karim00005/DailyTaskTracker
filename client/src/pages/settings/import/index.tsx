import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FilePlus2, FileCheck2, FolderUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function ImportPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<any>(null);

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploadProgress(0);
      const xhr = new XMLHttpRequest();
      
      const promise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (err) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP error: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.onabort = () => reject(new Error('Upload aborted'));
      });
      
      xhr.open('POST', '/api/import/excel');
      xhr.send(formData);
      
      return promise;
    },
    onSuccess: (data) => {
      setImportResults(data.results);
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      toast({
        title: "نجاح الاستيراد",
        description: "تم استيراد البيانات بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: `فشل استيراد البيانات: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار ملف أولاً",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('excelFile', selectedFile);
    
    importMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">استيراد البيانات</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <span>استيراد ملف Excel</span>
              </div>
            </CardTitle>
            <CardDescription>
              استيراد بيانات من ملف Excel إلى النظام. يمكن استيراد العملاء والمنتجات والفواتير والمعاملات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="excel" className="mb-1">ملف Excel</Label>
                <Input
                  id="excel"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={importMutation.isPending}
                />
                <p className="text-sm text-gray-500">
                  يجب أن يحتوي ملف Excel على أوراق عمل بأسماء: المنتجات، العملاء، الفواتير، المعاملات
                </p>
              </div>
              
              {importMutation.isPending && (
                <div className="space-y-2">
                  <Label>جارٍ الرفع ({uploadProgress}%)</Label>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              
              {selectedFile && !importMutation.isPending && (
                <Alert>
                  <FileCheck2 className="h-4 w-4" />
                  <AlertTitle>تم اختيار الملف</AlertTitle>
                  <AlertDescription>
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} كيلوبايت)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending ? "جارٍ الاستيراد..." : "استيراد البيانات"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                <span>نتائج الاستيراد</span>
              </div>
            </CardTitle>
            <CardDescription>
              معلومات عن نتائج عملية الاستيراد الأخيرة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importResults ? (
              <div className="space-y-4">
                {importResults.products && (
                  <div className="space-y-1">
                    <h3 className="font-medium">المنتجات</h3>
                    {importResults.products.success ? (
                      <p className="text-green-600">تم استيراد {importResults.products.count} منتج بنجاح</p>
                    ) : (
                      <p className="text-red-500">{importResults.products.message}</p>
                    )}
                  </div>
                )}
                
                {importResults.clients && (
                  <div className="space-y-1">
                    <h3 className="font-medium">العملاء</h3>
                    {importResults.clients.success ? (
                      <p className="text-green-600">تم استيراد {importResults.clients.count} عميل بنجاح</p>
                    ) : (
                      <p className="text-red-500">{importResults.clients.message}</p>
                    )}
                  </div>
                )}
                
                {importResults.invoices && (
                  <div className="space-y-1">
                    <h3 className="font-medium">الفواتير</h3>
                    {importResults.invoices.success ? (
                      <p className="text-green-600">تم استيراد {importResults.invoices.count} فاتورة بنجاح</p>
                    ) : (
                      <p className="text-red-500">{importResults.invoices.message}</p>
                    )}
                  </div>
                )}
                
                {importResults.transactions && (
                  <div className="space-y-1">
                    <h3 className="font-medium">المعاملات المالية</h3>
                    {importResults.transactions.success ? (
                      <p className="text-green-600">تم استيراد {importResults.transactions.count} معاملة بنجاح</p>
                    ) : (
                      <p className="text-red-500">{importResults.transactions.message}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 space-y-2">
                <FilePlus2 className="h-12 w-12 mx-auto opacity-30" />
                <p>لم يتم استيراد أي بيانات بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Separator className="my-6" />
      
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <FolderUp className="h-5 w-5" />
              <span>إرشادات الاستيراد</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">بنية ملف Excel</h3>
              <p>يجب أن يحتوي ملف Excel على الأوراق التالية:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>المنتجات (Products): بيانات المنتجات</li>
                <li>العملاء (Clients): بيانات العملاء</li>
                <li>الفواتير (Invoices): بيانات الفواتير</li>
                <li>بنود الفواتير (InvoiceItems): تفاصيل بنود الفواتير</li>
                <li>المعاملات (Transactions): المعاملات المالية</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">الأعمدة المطلوبة</h3>
              <p>كل ورقة عمل يجب أن تحتوي على الأعمدة المناسبة:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="font-medium">المنتجات:</p>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    <li>code: كود المنتج</li>
                    <li>name: اسم المنتج</li>
                    <li>description: وصف المنتج</li>
                    <li>category: فئة المنتج</li>
                    <li>unit: وحدة القياس</li>
                    <li>basePrice: سعر التكلفة</li>
                    <li>sellingPrice: سعر البيع</li>
                    <li>wholesalePrice: سعر الجملة</li>
                    <li>stock: الكمية المتوفرة</li>
                    <li>minStock: الحد الأدنى للمخزون</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium">العملاء:</p>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    <li>name: اسم العميل</li>
                    <li>phone: هاتف</li>
                    <li>mobile: جوال</li>
                    <li>email: البريد الإلكتروني</li>
                    <li>address: العنوان</li>
                    <li>type: النوع (عميل/مورد)</li>
                    <li>balance: الرصيد</li>
                    <li>taxNumber: الرقم الضريبي</li>
                    <li>commercialRecord: السجل التجاري</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">ملاحظات هامة</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>سيتم استبدال البيانات الحالية بالبيانات الجديدة في ملف Excel.</li>
                <li>تأكد من صحة البيانات وتنسيقها قبل الاستيراد.</li>
                <li>يفضل عمل نسخة احتياطية قبل استيراد بيانات جديدة.</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}