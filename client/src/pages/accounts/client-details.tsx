import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateArabic } from "@/lib/utils/arabic-date";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const ClientDetails: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Extract client ID from URL
  const clientId = location.split("/").pop();
  
  // Fetch client data
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });
  
  // Fetch client invoices
  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: [`/api/invoices`, { clientId }],
    enabled: !!clientId,
  });
  
  // Fetch client transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: [`/api/transactions`, { clientId }],
    enabled: !!clientId,
  });
  
  // Edit client state
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<any>(null);
  
  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest("PUT", `/api/clients/${clientId}`, clientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      
      toast({
        title: "تم تحديث الحساب",
        description: "تم تحديث بيانات الحساب بنجاح",
      });
      
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الحساب",
        variant: "destructive",
      });
      console.error("Client update error:", error);
    },
  });
  
  // Initialize editing form
  React.useEffect(() => {
    if (client && !editedClient) {
      setEditedClient({ ...client });
    }
  }, [client, editedClient]);
  
  // Handle save
  const handleSaveChanges = () => {
    if (editedClient) {
      updateClientMutation.mutate(editedClient);
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedClient({ ...editedClient, [name]: value });
  };
  
  // Create new receipt
  const handleCreateReceipt = () => {
    navigate(`/treasury/receipt?clientId=${clientId}`);
  };
  
  // Create new payment
  const handleCreatePayment = () => {
    navigate(`/treasury/payment?clientId=${clientId}`);
  };
  
  // Create new invoice
  const handleCreateInvoice = () => {
    navigate(`/sales/invoice?clientId=${clientId}`);
  };
  
  // Delete client
  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "تم حذف الحساب",
        description: "تم حذف الحساب بنجاح",
      });
      
      navigate("/accounts");
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الحساب",
        variant: "destructive",
      });
      console.error("Client deletion error:", error);
    },
  });
  
  const handleDeleteClient = () => {
    if (confirm(`هل أنت متأكد من حذف الحساب "${client?.name}"؟`)) {
      deleteClientMutation.mutate();
    }
  };
  
  // Invoice columns for DataTable
  const invoiceColumns = [
    {
      key: "#",
      header: "#",
      cell: (_: any, index: number) => index + 1,
    },
    {
      key: "date",
      header: "التاريخ",
      cell: (row: any) => {
        const date = new Date(row.date);
        return <span>{formatDateArabic(date, false)}</span>;
      },
      sortable: true,
    },
    {
      key: "invoiceNumber",
      header: "رقم الفاتورة",
      cell: (row: any) => (
        <div 
          className="text-primary font-medium hover:underline cursor-pointer"
          onClick={() => navigate(`/sales/invoice/${row.id}`)}
        >
          {row.invoiceNumber}
        </div>
      ),
      sortable: true,
    },
    {
      key: "invoiceType",
      header: "نوع الفاتورة",
      cell: (row: any) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          row.invoiceType === "بيع" 
            ? "bg-green-100 text-green-800" 
            : row.invoiceType === "شراء" 
              ? "bg-blue-100 text-blue-800"
              : "bg-yellow-100 text-yellow-800"
        }`}>
          {row.invoiceType}
        </span>
      ),
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "طريقة السداد",
      cell: (row: any) => row.paymentMethod,
    },
    {
      key: "total",
      header: "المبلغ",
      cell: (row: any) => formatCurrency(row.total),
      sortable: true,
    },
    {
      key: "paid",
      header: "المدفوع",
      cell: (row: any) => formatCurrency(row.paid),
      sortable: true,
    },
    {
      key: "balance",
      header: "المتبقي",
      cell: (row: any) => (
        <span className={`font-medium ${parseFloat(row.balance) > 0 ? "text-red-600" : "text-green-600"}`}>
          {formatCurrency(row.balance)}
        </span>
      ),
      sortable: true,
      footer: (data: any[]) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.balance), 0);
        return (
          <span className={`font-bold ${total > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(total)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "الإجراءات",
      cell: (row: any) => (
        <div className="flex justify-center space-x-2 space-x-reverse">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark"
            onClick={() => navigate(`/sales/invoice/${row.id}`)}
          >
            <Icon name="edit" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary-dark"
            onClick={() => navigate(`/sales/invoice/${row.id}`)}
          >
            <Icon name="print" size={18} />
          </Button>
        </div>
      ),
    },
  ];
  
  // Transaction columns for DataTable
  const transactionColumns = [
    {
      key: "#",
      header: "#",
      cell: (_: any, index: number) => index + 1,
    },
    {
      key: "date",
      header: "التاريخ",
      cell: (row: any) => {
        const date = new Date(row.date);
        return <span>{formatDateArabic(date, false)}</span>;
      },
      sortable: true,
    },
    {
      key: "transactionNumber",
      header: "رقم العملية",
      cell: (row: any) => row.transactionNumber,
      sortable: true,
    },
    {
      key: "transactionType",
      header: "نوع العملية",
      cell: (row: any) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          row.transactionType === "قبض" 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {row.transactionType}
        </span>
      ),
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "طريقة السداد",
      cell: (row: any) => row.paymentMethod,
    },
    {
      key: "bank",
      header: "البنك",
      cell: (row: any) => row.bank || "—",
    },
    {
      key: "amount",
      header: "المبلغ",
      cell: (row: any) => (
        <span className={`font-medium ${
          row.transactionType === "قبض" ? "text-green-600" : "text-red-600"
        }`}>
          {formatCurrency(row.amount)}
        </span>
      ),
      sortable: true,
      footer: (data: any[]) => {
        let receipts = 0;
        let payments = 0;
        
        data.forEach(row => {
          if (row.transactionType === "قبض") {
            receipts += parseFloat(row.amount);
          } else {
            payments += parseFloat(row.amount);
          }
        });
        
        return (
          <div className="flex justify-between">
            <span className="text-green-600 font-medium">المقبوضات: {formatCurrency(receipts)}</span>
            <span className="text-red-600 font-medium">المدفوعات: {formatCurrency(payments)}</span>
          </div>
        );
      },
    },
    {
      key: "notes",
      header: "البيان",
      cell: (row: any) => row.notes || "—",
    },
  ];
  
  // Loading state
  if (isClientLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  // Error state if client not found
  if (!client) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl text-gray-300 mb-3">
          <Icon name="close" size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2">الحساب غير موجود</h2>
        <p className="text-gray-500 mb-4">لم يتم العثور على الحساب المطلوب</p>
        <Button onClick={() => navigate("/accounts")}>
          العودة إلى قائمة الحسابات
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">بيانات الحساب</h1>
        <div className="flex space-x-2 space-x-reverse">
          <Button variant="outline" onClick={() => navigate("/accounts")}>
            <Icon name="prev" className="ml-1" size={16} />
            العودة
          </Button>
          {!isEditing ? (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              <Icon name="edit" className="ml-1" size={16} />
              تعديل
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSaveChanges}>
              <Icon name="save" className="ml-1" size={16} />
              حفظ
            </Button>
          )}
        </div>
      </div>

      {/* Client Information */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-1">{client.name}</h2>
              <div className="flex space-x-2 space-x-reverse mb-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-800`}>
                  {client.type}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  client.accountType === "مدين" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                }`}>
                  {client.accountType}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  client.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {client.isActive ? "نشط" : "غير نشط"}
                </span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">الرصيد</div>
              <div className={`text-2xl font-bold ${
                parseFloat(client.balance) > 0 ? "text-red-600" : parseFloat(client.balance) < 0 ? "text-green-600" : ""
              }`}>
                {formatCurrency(client.balance)}
              </div>
            </div>
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="name">اسم الحساب</Label>
                <Input
                  id="name"
                  name="name"
                  value={editedClient.name}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="code">الكود</Label>
                <Input
                  id="code"
                  name="code"
                  value={editedClient.code || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="taxId">الرقم الضريبي</Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={editedClient.taxId || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="mobile">رقم الجوال</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  value={editedClient.mobile || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editedClient.phone || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  value={editedClient.email || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="city">المدينة</Label>
                <Input
                  id="city"
                  name="city"
                  value={editedClient.city || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  name="address"
                  value={editedClient.address || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="md:col-span-3">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={editedClient.notes || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={editedClient.isActive}
                  onChange={(e) => setEditedClient({ ...editedClient, isActive: e.target.checked })}
                  className="form-checkbox"
                />
                <Label htmlFor="isActive">حساب نشط</Label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-500">الكود</div>
                <div>{client.code || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">الرقم الضريبي</div>
                <div>{client.taxId || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">رقم الجوال</div>
                <div dir="ltr" className="text-left">{client.mobile || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">رقم الهاتف</div>
                <div dir="ltr" className="text-left">{client.phone || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                <div>{client.email || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">المدينة</div>
                <div>{client.city || "—"}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-sm text-gray-500">العنوان</div>
                <div>{client.address || "—"}</div>
              </div>
              {client.notes && (
                <div className="md:col-span-3">
                  <div className="text-sm text-gray-500">ملاحظات</div>
                  <div>{client.notes}</div>
                </div>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            <div>
              <Button variant="destructive" onClick={handleDeleteClient}>
                <Icon name="delete" className="ml-2" size={16} />
                حذف الحساب
              </Button>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="secondary" onClick={handleCreateInvoice}>
                <Icon name="sales" className="ml-2" size={16} />
                فاتورة جديدة
              </Button>
              <Button 
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCreateReceipt}
              >
                <Icon name="receipt" className="ml-2" size={16} />
                سند قبض
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleCreatePayment}
              >
                <Icon name="payment" className="ml-2" size={16} />
                سند صرف
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Transactions */}
      <Card>
        <Tabs defaultValue="invoices">
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList>
              <TabsTrigger value="invoices">الفواتير</TabsTrigger>
              <TabsTrigger value="transactions">الحركات المالية</TabsTrigger>
              <TabsTrigger value="statement">كشف حساب</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="invoices" className="p-0">
            <DataTable
              columns={invoiceColumns}
              data={invoices || []}
              showFooter={true}
              withPagination={true}
              isLoading={isInvoicesLoading}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-5xl text-gray-300 mb-3">
                    <Icon name="sales" size={48} />
                  </div>
                  <p className="text-gray-500 mb-6">لا توجد فواتير لهذا الحساب</p>
                  <Button onClick={handleCreateInvoice}>
                    <Icon name="add" className="ml-1" size={16} />
                    إنشاء فاتورة جديدة
                  </Button>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="transactions" className="p-0">
            <DataTable
              columns={transactionColumns}
              data={transactions || []}
              showFooter={true}
              withPagination={true}
              isLoading={isTransactionsLoading}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-5xl text-gray-300 mb-3">
                    <Icon name="payment" size={48} />
                  </div>
                  <p className="text-gray-500 mb-6">لا توجد حركات مالية لهذا الحساب</p>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button 
                      onClick={handleCreateReceipt}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Icon name="receipt" className="ml-1" size={16} />
                      سند قبض
                    </Button>
                    <Button
                      onClick={handleCreatePayment}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Icon name="payment" className="ml-1" size={16} />
                      سند صرف
                    </Button>
                  </div>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="statement" className="p-0">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">كشف حساب</h3>
                <Button variant="outline">
                  <Icon name="print" className="ml-1" size={16} />
                  طباعة الكشف
                </Button>
              </div>
              
              {/* Statement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500">الرصيد الافتتاحي</div>
                    <div className="text-xl font-bold">0.00 ج.م</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500">إجمالي الحركة المدينة</div>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(
                        (invoices || [])
                          .filter(inv => inv.invoiceType === "بيع")
                          .reduce((sum, inv) => sum + parseFloat(inv.total), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-500">إجمالي الحركة الدائنة</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(
                        (transactions || [])
                          .filter(tr => tr.transactionType === "قبض")
                          .reduce((sum, tr) => sum + parseFloat(tr.amount), 0)
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Combined Transactions for Statement */}
              {isInvoicesLoading || isTransactionsLoading ? (
                <div className="animate-pulse space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-right">التاريخ</th>
                          <th className="px-4 py-2 text-right">البيان</th>
                          <th className="px-4 py-2 text-right">مدين</th>
                          <th className="px-4 py-2 text-right">دائن</th>
                          <th className="px-4 py-2 text-right">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Combine and sort invoices and transactions */}
                        {[
                          ...(invoices || []).map(inv => ({
                            date: inv.date,
                            time: inv.time,
                            description: `فاتورة ${inv.invoiceType} رقم ${inv.invoiceNumber}`,
                            debit: inv.invoiceType === "بيع" ? parseFloat(inv.total) : 0,
                            credit: inv.invoiceType === "شراء" ? parseFloat(inv.total) : 0,
                            type: "invoice"
                          })),
                          ...(transactions || []).map(tr => ({
                            date: tr.date,
                            time: tr.time,
                            description: `${tr.transactionType} - ${tr.notes || ""}`,
                            debit: tr.transactionType === "صرف" ? parseFloat(tr.amount) : 0,
                            credit: tr.transactionType === "قبض" ? parseFloat(tr.amount) : 0,
                            type: "transaction"
                          }))
                        ]
                          .sort((a, b) => {
                            // Sort by date and time
                            const dateA = new Date(`${a.date}T${a.time}`);
                            const dateB = new Date(`${b.date}T${b.time}`);
                            return dateA.getTime() - dateB.getTime();
                          })
                          .map((item, index, arr) => {
                            // Calculate running balance
                            let balance = 0;
                            for (let i = 0; i <= index; i++) {
                              balance += arr[i].debit - arr[i].credit;
                            }
                            
                            return (
                              <tr key={`${item.type}-${index}`} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border-t">
                                  {new Date(item.date).toLocaleDateString("ar-EG")}
                                </td>
                                <td className="px-4 py-2 border-t">{item.description}</td>
                                <td className="px-4 py-2 border-t">
                                  {item.debit > 0 ? formatCurrency(item.debit) : "—"}
                                </td>
                                <td className="px-4 py-2 border-t">
                                  {item.credit > 0 ? formatCurrency(item.credit) : "—"}
                                </td>
                                <td className={`px-4 py-2 border-t font-medium ${
                                  balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : ""
                                }`}>
                                  {formatCurrency(balance)}
                                </td>
                              </tr>
                            );
                          })}
                          
                        {/* Empty state */}
                        {(!invoices || invoices.length === 0) && (!transactions || transactions.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              لا توجد حركات لعرضها في كشف الحساب
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </>
  );
};

export default ClientDetails;
