import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format-currency";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SalesInvoiceDetails: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract invoice ID from URL
  const invoiceId = location.split("/").pop();
  
  // Fetch invoice data
  const { data: invoice, isLoading: isInvoiceLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });
  
  // Fetch invoice items
  const { data: invoiceItems, isLoading: isItemsLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/items`],
    enabled: !!invoiceId,
  });
  
  // Fetch client data
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${invoice?.clientId}`],
    enabled: !!invoice?.clientId,
  });
  
  // Fetch products data
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "تم حذف الفاتورة",
        description: "تم حذف الفاتورة بنجاح",
      });
      
      navigate("/sales");
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الفاتورة",
        variant: "destructive",
      });
      console.error("Invoice deletion error:", error);
    },
  });
  
  const handleDeleteInvoice = () => {
    if (confirm("هل أنت متأكد من حذف الفاتورة؟")) {
      deleteInvoiceMutation.mutate(invoiceId!);
    }
  };
  
  // Print invoice
  const handlePrintInvoice = () => {
    window.print();
  };
  
  // Edit invoice
  const handleEditInvoice = () => {
    // Navigate to edit page (or show modal)
    toast({
      title: "تعديل الفاتورة",
      description: "ميزة تعديل الفاتورة قيد التطوير",
    });
  };
  
  // Loading state
  if (isInvoiceLoading || isItemsLoading || isClientLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  // Error state if invoice not found
  if (!invoice) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl text-gray-300 mb-3">
          <Icon name="close" size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2">الفاتورة غير موجودة</h2>
        <p className="text-gray-500 mb-4">لم يتم العثور على الفاتورة المطلوبة</p>
        <Button onClick={() => navigate("/sales")}>
          العودة إلى قائمة الفواتير
        </Button>
      </div>
    );
  }
  
  // Calculate totals
  const totalQuantity = invoiceItems?.reduce((acc: number, item: any) => acc + parseFloat(item.quantity), 0) || 0;
  const totalBeforeDiscount = invoiceItems?.reduce((acc: number, item: any) => acc + (parseFloat(item.unitPrice) * parseFloat(item.quantity)), 0) || 0;
  const totalDiscount = invoiceItems?.reduce((acc: number, item: any) => acc + parseFloat(item.discount), 0) || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">تفاصيل الفاتورة #{invoice.invoiceNumber}</h1>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={() => navigate("/sales")}>
            <Icon name="prev" className="ml-1" size={16} />
            العودة
          </Button>
          <Button variant="primary" onClick={handlePrintInvoice}>
            <Icon name="print" className="ml-1" size={16} />
            طباعة
          </Button>
        </div>
      </div>

      {/* Invoice Header */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-2">بيانات الفاتورة</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الفاتورة:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">التاريخ:</span>
                <span>{invoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الوقت:</span>
                <span>{invoice.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">نوع الفاتورة:</span>
                <span>{invoice.invoiceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">طريقة السداد:</span>
                <span className={`${invoice.paymentMethod === "آجل" ? "text-yellow-600" : "text-green-600"} font-medium`}>
                  {invoice.paymentMethod}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">بيانات العميل</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">اسم العميل:</span>
                <span className="font-medium">{client?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الجوال:</span>
                <span>{client?.mobile || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">العنوان:</span>
                <span>{client?.address || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المدينة:</span>
                <span>{client?.city || "—"}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">ملخص الفاتورة</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">الإجمالي:</span>
                <span className="font-bold">{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الخصم:</span>
                <span className="font-medium">{formatCurrency(invoice.discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الضريبة:</span>
                <span className="font-medium">{formatCurrency(invoice.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 mt-1">
                <span className="text-gray-700 font-medium">المجموع النهائي:</span>
                <span className="font-bold text-lg text-primary">{formatCurrency(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المدفوع:</span>
                <span className="font-medium">{formatCurrency(invoice.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المتبقي:</span>
                <span className={`font-medium ${parseFloat(invoice.balance) > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(invoice.balance)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>رقم الصنف</TableHead>
                <TableHead>اسم الصنف</TableHead>
                <TableHead>وحدة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>الخصم</TableHead>
                <TableHead>الصافي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems && invoiceItems.length > 0 ? (
                invoiceItems.map((item: any, index: number) => {
                  const product = products?.find((p: any) => p.id === item.productId);
                  const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
                  const netTotal = itemTotal - parseFloat(item.discount);
                  
                  return (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{product?.code || item.productId}</TableCell>
                      <TableCell>{product?.name || "—"}</TableCell>
                      <TableCell>{product?.unitOfMeasure || "—"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell>{formatCurrency(itemTotal)}</TableCell>
                      <TableCell>{formatCurrency(item.discount)}</TableCell>
                      <TableCell>{formatCurrency(netTotal)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Icon name="search" size={32} className="mb-2 text-gray-400" />
                      <p>لا توجد أصناف في هذه الفاتورة</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium">
                  الإجمالي
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium">
                  {totalQuantity}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium">
                  —
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium">
                  {formatCurrency(totalBeforeDiscount)}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium">
                  {formatCurrency(totalDiscount)}
                </td>
                <td className="px-6 py-3 text-right text-sm font-bold">
                  {formatCurrency(invoice.grandTotal)}
                </td>
              </tr>
            </tfoot>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">ملاحظات</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="destructive" onClick={handleDeleteInvoice}>
          <Icon name="delete" className="ml-1" size={16} />
          حذف الفاتورة
        </Button>
        
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={handleEditInvoice}>
            <Icon name="edit" className="ml-1" size={16} />
            تعديل الفاتورة
          </Button>
          <Button variant="primary" onClick={handlePrintInvoice}>
            <Icon name="print" className="ml-1" size={16} />
            طباعة الفاتورة
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceDetails;
