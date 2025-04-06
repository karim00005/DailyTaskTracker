import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format-currency";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define the form schema
const clientFormSchema = z.object({
  name: z.string().min(3, { message: "اسم العميل يجب أن يكون على الأقل 3 أحرف" }),
  type: z.string().min(1, { message: "نوع الحساب مطلوب" }),
  accountType: z.string().min(1, { message: "تصنيف الحساب مطلوب" }),
  code: z.string().optional(),
  taxId: z.string().optional(),
  balance: z.string().default("0"),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }).optional().or(z.literal("")),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

const Accounts: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filter state
  const [filterType, setFilterType] = useState<string>("");
  const [filterAccountType, setFilterAccountType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // New client dialog state
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState<boolean>(false);
  
  // Get clients data
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Get transactions data (for activity summary)
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: ClientFormValues) => {
      const response = await apiRequest("POST", "/api/clients", clientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsNewClientDialogOpen(false);
      
      toast({
        title: "تم إنشاء الحساب",
        description: "تم إنشاء الحساب بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
      console.error("Client creation error:", error);
    },
  });
  
  // Form for new client
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      type: "عميل",
      accountType: "مدين",
      balance: "0",
      isActive: true,
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ClientFormValues) => {
    createClientMutation.mutate(data);
  };
  
  // Filter clients
  const filteredClients = clients
    ?.filter((client: any) => 
      (filterType === "" || client.type === filterType) &&
      (filterAccountType === "" || client.accountType === filterAccountType) &&
      (searchTerm === "" || 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.mobile?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "تم حذف الحساب",
        description: "تم حذف الحساب بنجاح",
      });
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
  
  // Handle delete client
  const handleDeleteClient = (client: any) => {
    if (confirm(`هل أنت متأكد من حذف الحساب "${client.name}"؟`)) {
      deleteClientMutation.mutate(client.id);
    }
  };
  
  // Client columns for DataTable
  const clientColumns = [
    {
      key: "#",
      header: "#",
      cell: (_: any, index: number) => index + 1,
    },
    {
      key: "code",
      header: "الكود",
      cell: (row: any) => row.code || "—",
      sortable: true,
    },
    {
      key: "name",
      header: "الاسم",
      cell: (row: any) => (
        <div>
          <div className="font-medium hover:text-primary cursor-pointer" onClick={() => navigate(`/accounts/client/${row.id}`)}>
            {row.name}
          </div>
          <div className="text-xs text-gray-500">{row.type}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "mobile",
      header: "الجوال",
      cell: (row: any) => row.mobile || "—",
      sortable: true,
    },
    {
      key: "city",
      header: "المدينة",
      cell: (row: any) => row.city || "—",
      sortable: true,
    },
    {
      key: "balance",
      header: "الرصيد",
      cell: (row: any) => (
        <span className={`font-medium ${parseFloat(row.balance) > 0 ? "text-red-600" : parseFloat(row.balance) < 0 ? "text-green-600" : ""}`}>
          {formatCurrency(row.balance)}
        </span>
      ),
      sortable: true,
      footer: (data: any[]) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.balance), 0);
        return (
          <span className={`font-bold ${total > 0 ? "text-red-600" : total < 0 ? "text-green-600" : ""}`}>
            {formatCurrency(total)}
          </span>
        );
      },
    },
    {
      key: "accountType",
      header: "النوع",
      cell: (row: any) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.accountType === "مدين" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
          {row.accountType}
        </span>
      ),
      sortable: true,
    },
    {
      key: "isActive",
      header: "الحالة",
      cell: (row: any) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {row.isActive ? "نشط" : "غير نشط"}
        </span>
      ),
      sortable: true,
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
            onClick={() => navigate(`/accounts/client/${row.id}`)}
          >
            <Icon name="edit" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:text-red-700"
            onClick={() => handleDeleteClient(row)}
          >
            <Icon name="delete" size={18} />
          </Button>
        </div>
      ),
    },
  ];
  
  // Calculate summary statistics
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter((c: any) => c.isActive).length || 0;
  const totalBalance = clients?.reduce((sum: number, client: any) => sum + parseFloat(client.balance), 0) || 0;
  
  // Transaction activity
  const recentTransactions = transactions
    ?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) || [];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">الحسابات</h1>
        <Button onClick={() => setIsNewClientDialogOpen(true)}>
          <Icon name="add" className="ml-1" size={16} />
          حساب جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-blue-800 font-medium mb-1">إجمالي الحسابات</div>
            <div className="text-2xl font-bold text-blue-800">{totalClients}</div>
            <div className="text-sm text-blue-600 mt-1">حساب مسجل</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-green-800 font-medium mb-1">الحسابات النشطة</div>
            <div className="text-2xl font-bold text-green-800">{activeClients}</div>
            <div className="text-sm text-green-600 mt-1">حساب نشط</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-red-800 font-medium mb-1">إجمالي المستحقات</div>
            <div className="text-2xl font-bold text-red-800">{formatCurrency(totalBalance)}</div>
            <div className="text-sm text-red-600 mt-1">الرصيد المدين</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-yellow-800 font-medium mb-1">حركات اليوم</div>
            <div className="text-2xl font-bold text-yellow-800">
              {transactions?.filter((t: any) => {
                const today = new Date().toISOString().split("T")[0];
                return t.date === today;
              }).length || 0}
            </div>
            <div className="text-sm text-yellow-600 mt-1">حركة مالية</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">فلترة الحسابات</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type-filter" className="mb-1 block">نوع الحساب</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger id="type-filter">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="عميل">عميل</SelectItem>
                      <SelectItem value="مورد">مورد</SelectItem>
                      <SelectItem value="موظف">موظف</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="account-type-filter" className="mb-1 block">تصنيف الحساب</Label>
                  <Select value={filterAccountType} onValueChange={setFilterAccountType}>
                    <SelectTrigger id="account-type-filter">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="مدين">مدين</SelectItem>
                      <SelectItem value="دائن">دائن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="search" className="mb-1 block">بحث</Label>
                  <Input
                    id="search"
                    placeholder="بحث بالاسم أو الكود أو الجوال"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full">
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-4">آخر الحركات</h2>
              
              {isTransactionsLoading ? (
                <div className="animate-pulse space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded"></div>
                  ))}
                </div>
              ) : recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {recentTransactions.map((transaction: any) => {
                    const client = clients?.find((c: any) => c.id === transaction.clientId);
                    
                    return (
                      <div key={transaction.id} className="flex justify-between items-center p-2 border-b">
                        <div>
                          <div className="font-medium">{transaction.transactionType === "قبض" ? "قبض من" : "صرف إلى"} {client?.name}</div>
                          <div className="text-xs text-gray-500">{transaction.date}</div>
                        </div>
                        <div className={`font-bold ${transaction.transactionType === "قبض" ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  لا توجد حركات حديثة
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <Tabs defaultValue="all">
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList>
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="clients">العملاء</TabsTrigger>
              <TabsTrigger value="suppliers">الموردين</TabsTrigger>
              <TabsTrigger value="employees">الموظفين</TabsTrigger>
              <TabsTrigger value="others">أخرى</TabsTrigger>
            </TabsList>
            
            <Button variant="outline" onClick={() => setIsNewClientDialogOpen(true)}>
              <Icon name="add" className="ml-1" size={16} />
              حساب جديد
            </Button>
          </div>
          
          <TabsContent value="all" className="p-0">
            <DataTable
              columns={clientColumns}
              data={filteredClients}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isClientsLoading}
              isSelectable={true}
              onRowClick={(row) => navigate(`/accounts/client/${row.id}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-5xl text-gray-300 mb-3">
                    <Icon name="clients" size={48} />
                  </div>
                  <p className="text-gray-500 mb-6">لا توجد حسابات للعرض</p>
                  <Button onClick={() => setIsNewClientDialogOpen(true)}>
                    <Icon name="add" className="ml-1" size={16} />
                    إنشاء حساب جديد
                  </Button>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="clients" className="p-0">
            <DataTable
              columns={clientColumns}
              data={filteredClients.filter((c: any) => c.type === "عميل")}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isClientsLoading}
              isSelectable={true}
              onRowClick={(row) => navigate(`/accounts/client/${row.id}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا يوجد عملاء للعرض</p>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="suppliers" className="p-0">
            <DataTable
              columns={clientColumns}
              data={filteredClients.filter((c: any) => c.type === "مورد")}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isClientsLoading}
              isSelectable={true}
              onRowClick={(row) => navigate(`/accounts/client/${row.id}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا يوجد موردين للعرض</p>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="employees" className="p-0">
            <DataTable
              columns={clientColumns}
              data={filteredClients.filter((c: any) => c.type === "موظف")}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isClientsLoading}
              isSelectable={true}
              onRowClick={(row) => navigate(`/accounts/client/${row.id}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا يوجد موظفين للعرض</p>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="others" className="p-0">
            <DataTable
              columns={clientColumns}
              data={filteredClients.filter((c: any) => c.type === "أخرى")}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isClientsLoading}
              isSelectable={true}
              onRowClick={(row) => navigate(`/accounts/client/${row.id}`)}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا توجد حسابات أخرى للعرض</p>
                </div>
              }
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* New Client Dialog */}
      <Dialog open={isNewClientDialogOpen} onOpenChange={setIsNewClientDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة حساب جديد</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الحساب</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم الحساب" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود الحساب</FormLabel>
                      <FormControl>
                        <Input placeholder="كود الحساب (اختياري)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الحساب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الحساب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="عميل">عميل</SelectItem>
                          <SelectItem value="مورد">مورد</SelectItem>
                          <SelectItem value="موظف">موظف</SelectItem>
                          <SelectItem value="أخرى">أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تصنيف الحساب</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر تصنيف الحساب" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="مدين">مدين</SelectItem>
                          <SelectItem value="دائن">دائن</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الجوال</FormLabel>
                      <FormControl>
                        <Input placeholder="رقم الجوال" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl>
                        <Input placeholder="رقم الهاتف (اختياري)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني</FormLabel>
                      <FormControl>
                        <Input placeholder="البريد الإلكتروني (اختياري)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الرقم الضريبي</FormLabel>
                      <FormControl>
                        <Input placeholder="الرقم الضريبي (اختياري)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدينة</FormLabel>
                      <FormControl>
                        <Input placeholder="المدينة (اختياري)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>العنوان</FormLabel>
                      <FormControl>
                        <Input placeholder="العنوان (اختياري)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ملاحظات</FormLabel>
                    <FormControl>
                      <Input placeholder="ملاحظات (اختياري)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">
                  {createClientMutation.isPending ? "جاري الحفظ..." : "حفظ الحساب"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Accounts;
