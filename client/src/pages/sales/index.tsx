import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Icon } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatDateArabic } from "@/lib/utils/arabic-date";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

const Sales: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Search params state
  const [searchTab, setSearchTab] = useState("advanced");
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("آجل");
  const [selectedAccountType, setSelectedAccountType] = useState<string>("");
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("الكل");
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Data fetching
  const { data: warehouses, isLoading: isWarehousesLoading } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Get selected invoice details
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  
  const { data: invoiceItems, isLoading: isInvoiceItemsLoading } = useQuery({
    queryKey: ["/api/invoices", selectedInvoice, "items"],
    enabled: !!selectedInvoice
  });

  // View invoice details
  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice.id);
  };

  // Add new invoice
  const handleNewInvoice = () => {
    navigate("/sales/invoice");
  };

  // Print invoice
  const handlePrintInvoice = (invoice: any) => {
    toast({
      title: "طباعة الفاتورة",
      description: `جاري طباعة الفاتورة رقم ${invoice.invoiceNumber}`,
    });
  };

  // Delete invoice
  const handleDeleteInvoice = (invoice: any) => {
    toast({
      title: "تأكيد الحذف",
      description: `هل أنت متأكد من حذف الفاتورة رقم ${invoice.invoiceNumber}؟`,
      variant: "destructive",
    });
  };

  // Search for invoices
  const handleSearch = () => {
    toast({
      title: "جاري البحث",
      description: "جاري البحث عن الفواتير المطابقة للمعايير المحددة.",
    });
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
      key: "time",
      header: "الوقت",
      cell: (row: any) => row.time,
      sortable: true,
    },
    {
      key: "invoiceNumber",
      header: "رقم الفاتورة",
      cell: (row: any) => (
        <Link href={`/sales/invoice/${row.id}`}>
          <a className="text-primary font-medium hover:underline">
            {row.invoiceNumber}
          </a>
        </Link>
      ),
      sortable: true,
    },
    {
      key: "clientId",
      header: "الحساب",
      cell: (row: any) => {
        const client = clients?.find((c: any) => c.id === row.clientId);
        return client?.name || "";
      },
      sortable: true,
    },
    {
      key: "paymentMethod",
      header: "طريقة السداد",
      cell: (row: any) => (
        <span className={`${row.paymentMethod === "آجل" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"} text-xs font-medium px-2 py-0.5 rounded-full`}>
          {row.paymentMethod}
        </span>
      ),
    },
    {
      key: "total",
      header: "كمية",
      cell: (row: any) => {
        // Get the sum of all item quantities for this invoice
        const items = invoiceItems?.filter((item: any) => item.invoiceId === row.id) || [];
        const totalQuantity = items.reduce((sum: number, item: any) => sum + parseFloat(item.quantity), 0);
        return totalQuantity;
      },
    },
    {
      key: "discount",
      header: "خصم",
      cell: (row: any) => row.discount,
      sortable: true,
    },
    {
      key: "balance",
      header: "الصافي",
      cell: (row: any) => row.balance,
      sortable: true,
    },
    {
      key: "grandTotal",
      header: "الإجمالي",
      cell: (row: any) => (
        <span className="font-bold">{formatCurrency(row.grandTotal)}</span>
      ),
      sortable: true,
      footer: (data: any[]) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.grandTotal), 0);
        return <span className="font-bold">{formatCurrency(total)}</span>;
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
            onClick={() => handleViewInvoice(row)}
          >
            <Icon name="edit" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:text-red-700"
            onClick={() => handleDeleteInvoice(row)}
          >
            <Icon name="delete" size={18} />
          </Button>
        </div>
      ),
    },
  ];

  // Product items columns for DataTable
  const productColumns = [
    {
      key: "#",
      header: "#",
      cell: (_: any, index: number) => index + 1,
    },
    {
      key: "productId",
      header: "رقم الصنف",
      sortable: true,
    },
    {
      key: "productName",
      header: "اسم الصنف",
      cell: (row: any) => {
        const products = invoices
          ?.map((invoice: any) => {
            const items = invoiceItems?.filter((item: any) => item.invoiceId === invoice.id) || [];
            return items;
          })
          .flat();
        const product = products?.find((product: any) => product.id === row.productId);
        return product?.name || "";
      },
      sortable: true,
    },
    {
      key: "unitOfMeasure",
      header: "وحدة",
      sortable: true,
    },
    {
      key: "product",
      header: "المنتج",
      sortable: true,
    },
    {
      key: "quantity",
      header: "كمية",
      sortable: true,
      footer: (data: any[]) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.quantity), 0);
        return <span className="font-medium">{total}</span>;
      },
    },
    {
      key: "unitPrice",
      header: "السعر",
      cell: (row: any) => formatCurrency(row.unitPrice),
      sortable: true,
      footer: (data: any[]) => {
        if (data.length === 0) return null;
        const avg = data.reduce((sum, row) => sum + parseFloat(row.unitPrice), 0) / data.length;
        return <span className="font-medium">{formatCurrency(avg)}</span>;
      },
    },
    {
      key: "discount",
      header: "الخصم",
      sortable: true,
      footer: (data: any[]) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.discount), 0);
        return <span className="font-medium">{total}</span>;
      },
    },
    {
      key: "price",
      header: "بيع",
      sortable: true,
    },
    {
      key: "total",
      header: "الصافي",
      cell: (row: any) => formatCurrency(row.total),
      sortable: true,
      footer: (data: any[]) => {
        const total = data.reduce((sum, row) => sum + parseFloat(row.total), 0);
        return <span className="font-bold">{formatCurrency(total)}</span>;
      },
    },
  ];

  // Filter only sales invoices
  const salesInvoices = invoices?.filter((invoice: any) => invoice.invoiceType === "بيع") || [];

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">المبيعات</h1>

      {/* Search Types */}
      <Card className="mb-4">
        <Tabs value={searchTab} onValueChange={setSearchTab}>
          <div className="grid grid-cols-2">
            <TabsList className="w-full">
              <TabsTrigger value="advanced" className="w-full">
                بحث متقدم
              </TabsTrigger>
              <TabsTrigger value="general" className="w-full">
                بحث عام
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Advanced Search Form */}
          <TabsContent value="advanced" className="p-4 border border-gray-200 rounded-b-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* First Column */}
              <div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">المخزن</label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- اختر --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- اختر --</SelectItem>
                      {warehouses?.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">الحساب</label>
                  <div className="relative">
                    <Input 
                      type="text" 
                      value={selectedAccount} 
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      placeholder="اختر أو اكتب اسم الحساب"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute inset-y-0 left-0 px-2 border-r border-gray-300 rounded-l-md"
                    >
                      <Icon name="search" size={16} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">طريقة السداد</label>
                  <div className="flex space-x-4 space-x-reverse">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="payment-type"
                        id="payment-cash"
                        checked={selectedPaymentMethod === "نقدي"}
                        onChange={() => setSelectedPaymentMethod("نقدي")}
                        className="ml-1"
                      />
                      <label htmlFor="payment-cash" className="text-sm">نقدي</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="payment-type"
                        id="payment-credit"
                        checked={selectedPaymentMethod === "آجل"}
                        onChange={() => setSelectedPaymentMethod("آجل")}
                        className="ml-1"
                      />
                      <label htmlFor="payment-credit" className="text-sm">آجل</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">إلى التاريخ</label>
                  <DatePickerAr date={endDate} setDate={setEndDate} />
                </div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">تصنيف الحساب</label>
                  <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- اختر --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- اختر --</SelectItem>
                      <SelectItem value="عميل">عميل</SelectItem>
                      <SelectItem value="مورد">مورد</SelectItem>
                      <SelectItem value="موظف">موظف</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">مندوب البيع</label>
                  <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- اختر --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- اختر --</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Third Column */}
              <div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">رقم الفاتورة/المرجع</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute inset-y-0 left-0 px-2 border-r border-gray-300 rounded-l-md"
                    >
                      <Icon name="search" size={16} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">حالة السداد</label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="الكل">الكل</SelectItem>
                      <SelectItem value="مسدد">مسدد</SelectItem>
                      <SelectItem value="غير مسدد">غير مسدد</SelectItem>
                      <SelectItem value="مسدد جزئياً">مسدد جزئياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col mb-4">
                  <label className="form-label">المستخدم</label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- اختر --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- اختر --</SelectItem>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Search Buttons */}
            <div className="flex justify-end space-x-2 space-x-reverse mt-4">
              <Button variant="outline" className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900" onClick={handleSearch}>
                <Icon name="search" className="ml-1" size={16} />
                عرض الأصناف
              </Button>
              <Button variant="default" className="bg-primary text-white hover:bg-primary/90" onClick={handleSearch}>
                <Icon name="search" className="ml-1" size={16} />
                عرض الفواتير
              </Button>
            </div>
          </TabsContent>

          {/* General Search Form */}
          <TabsContent value="general" className="p-4 border border-gray-200 rounded-b-md">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col">
                <label className="form-label">بحث عام</label>
                <Input
                  type="text"
                  placeholder="ابحث برقم الفاتورة أو اسم العميل"
                />
              </div>
              <Button className="w-full" onClick={handleSearch}>
                <Icon name="search" className="ml-1" size={16} />
                بحث
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Invoices Table */}
      <Card className="mb-4">
        <CardContent className="p-0">
          <DataTable
            columns={invoiceColumns}
            data={salesInvoices}
            showFooter={true}
            withPagination={true}
            withSearch={true}
            isLoading={isInvoicesLoading}
            isSelectable={true}
            onRowClick={(row) => navigate(`/sales/invoice/${row.id}`)}
            emptyState={
              <div className="flex flex-col items-center justify-center py-8">
                <div className="text-5xl text-gray-300 mb-3">
                  <Icon name="sales" size={48} />
                </div>
                <p className="text-gray-500 mb-6">لا توجد فواتير للعرض</p>
                <Button onClick={handleNewInvoice}>
                  <Icon name="add" className="ml-1" size={16} />
                  إنشاء فاتورة جديدة
                </Button>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Product Details */}
      {selectedInvoice && (
        <Card>
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-medium">تفاصيل الأصناف</h3>
          </div>
          <CardContent className="p-0">
            <DataTable
              columns={productColumns}
              data={invoiceItems || []}
              showFooter={true}
              isLoading={isInvoiceItemsLoading}
              emptyState={
                <div className="text-center py-4 text-gray-500">
                  لا توجد أصناف في هذه الفاتورة
                </div>
              }
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Sales;
