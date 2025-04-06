import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { Icon } from "@/components/icons";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils/format-currency";

const Reports: React.FC = () => {
  const [reportTab, setReportTab] = useState("sales");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  
  // Fetch data
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: warehouses } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  // Filter data based on selected tab and date range
  const salesInvoices = invoices?.filter((invoice: any) => 
    invoice.invoiceType === "بيع" && 
    new Date(invoice.date) >= startDate && 
    new Date(invoice.date) <= endDate
  ) || [];

  const purchaseInvoices = invoices?.filter((invoice: any) => 
    invoice.invoiceType === "شراء" && 
    new Date(invoice.date) >= startDate && 
    new Date(invoice.date) <= endDate
  ) || [];

  const filteredTransactions = transactions?.filter((transaction: any) => 
    new Date(transaction.date) >= startDate && 
    new Date(transaction.date) <= endDate
  ) || [];

  const receipts = filteredTransactions.filter((tr: any) => tr.transactionType === "قبض") || [];
  const payments = filteredTransactions.filter((tr: any) => tr.transactionType === "صرف") || [];

  // Calculate summary statistics
  const totalSales = salesInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0);
  const totalPurchases = purchaseInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total || 0), 0);
  const totalReceipts = receipts.reduce((sum: number, tr: any) => sum + parseFloat(tr.amount || 0), 0);
  const totalPayments = payments.reduce((sum: number, tr: any) => sum + parseFloat(tr.amount || 0), 0);

  const cashFlow = totalReceipts - totalPayments;
  const profit = totalSales - totalPurchases;

  // Handle report generation
  const generateReport = () => {
    // In a real implementation, this would generate and download/print the report
    window.print();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">التقارير</h1>
      
      {/* Report Types */}
      <Card>
        <Tabs value={reportTab} onValueChange={setReportTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="purchases">المشتريات</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
            <TabsTrigger value="treasury">الخزينة</TabsTrigger>
            <TabsTrigger value="customers">العملاء</TabsTrigger>
          </TabsList>
          
          {/* Sales Reports */}
          <TabsContent value="sales">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>من تاريخ</Label>
                  <DatePickerAr date={startDate} setDate={setStartDate} />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <DatePickerAr date={endDate} setDate={setEndDate} />
                </div>
                <div>
                  <Label>المخزن</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- الكل --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- الكل --</SelectItem>
                      {warehouses?.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <Button onClick={generateReport}>
                  <Icon name="print" className="ml-1" size={16} />
                  طباعة التقرير
                </Button>
              </div>
              
              {/* Sales Summary */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h2 className="text-lg font-bold mb-2">ملخص المبيعات</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">إجمالي المبيعات</div>
                    <div className="text-xl font-bold">{formatCurrency(totalSales)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">عدد الفواتير</div>
                    <div className="text-xl font-bold">{salesInvoices.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">متوسط قيمة الفاتورة</div>
                    <div className="text-xl font-bold">
                      {salesInvoices.length > 0 
                        ? formatCurrency(totalSales / salesInvoices.length)
                        : formatCurrency(0)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sales Chart Placeholder */}
              <div className="bg-gray-100 p-4 rounded-md h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Icon name="chart" size={48} className="mx-auto mb-2 text-gray-400" />
                  <div className="text-gray-500">رسم بياني للمبيعات</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Purchases Reports */}
          <TabsContent value="purchases">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>من تاريخ</Label>
                  <DatePickerAr date={startDate} setDate={setStartDate} />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <DatePickerAr date={endDate} setDate={setEndDate} />
                </div>
                <div>
                  <Label>المخزن</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- الكل --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- الكل --</SelectItem>
                      {warehouses?.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <Button onClick={generateReport}>
                  <Icon name="print" className="ml-1" size={16} />
                  طباعة التقرير
                </Button>
              </div>
              
              {/* Purchases Summary */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h2 className="text-lg font-bold mb-2">ملخص المشتريات</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">إجمالي المشتريات</div>
                    <div className="text-xl font-bold">{formatCurrency(totalPurchases)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">عدد الفواتير</div>
                    <div className="text-xl font-bold">{purchaseInvoices.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">متوسط قيمة الفاتورة</div>
                    <div className="text-xl font-bold">
                      {purchaseInvoices.length > 0 
                        ? formatCurrency(totalPurchases / purchaseInvoices.length)
                        : formatCurrency(0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Inventory Reports */}
          <TabsContent value="inventory">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>المخزن</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- الكل --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- الكل --</SelectItem>
                      {warehouses?.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>البحث</Label>
                  <Input type="text" placeholder="ابحث عن صنف معين" />
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <Button onClick={generateReport}>
                  <Icon name="print" className="ml-1" size={16} />
                  طباعة التقرير
                </Button>
              </div>
              
              {/* Inventory Summary */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h2 className="text-lg font-bold mb-2">ملخص المخزون</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">عدد الأصناف</div>
                    <div className="text-xl font-bold">{products?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">قيمة المخزون</div>
                    <div className="text-xl font-bold">
                      {formatCurrency(
                        products?.reduce(
                          (sum: number, product: any) => 
                            sum + parseFloat(product.stockQuantity || 0) * parseFloat(product.costPrice || 0),
                          0
                        ) || 0
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">الأصناف منخفضة المخزون</div>
                    <div className="text-xl font-bold">
                      {products?.filter((p: any) => 
                        parseFloat(p.stockQuantity || 0) < parseFloat(p.minStockLevel || 5)
                      ).length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Treasury Reports */}
          <TabsContent value="treasury">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>من تاريخ</Label>
                  <DatePickerAr date={startDate} setDate={setStartDate} />
                </div>
                <div>
                  <Label>إلى تاريخ</Label>
                  <DatePickerAr date={endDate} setDate={setEndDate} />
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <Button onClick={generateReport}>
                  <Icon name="print" className="ml-1" size={16} />
                  طباعة التقرير
                </Button>
              </div>
              
              {/* Treasury Summary */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h2 className="text-lg font-bold mb-2">ملخص الخزينة</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">إجمالي المقبوضات</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalReceipts)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">إجمالي المدفوعات</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(totalPayments)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">صافي التدفق النقدي</div>
                    <div className={`text-xl font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashFlow)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">صافي الربح</div>
                    <div className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profit)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Treasury Chart Placeholder */}
              <div className="bg-gray-100 p-4 rounded-md h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <Icon name="chart" size={48} className="mx-auto mb-2 text-gray-400" />
                  <div className="text-gray-500">رسم بياني للتدفقات النقدية</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Customers Reports */}
          <TabsContent value="customers">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>العميل</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- الكل --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- الكل --</SelectItem>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>نوع الحساب</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- الكل --" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">-- الكل --</SelectItem>
                      <SelectItem value="عميل">عميل</SelectItem>
                      <SelectItem value="مورد">مورد</SelectItem>
                      <SelectItem value="موظف">موظف</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end mb-4">
                <Button onClick={generateReport}>
                  <Icon name="print" className="ml-1" size={16} />
                  طباعة التقرير
                </Button>
              </div>
              
              {/* Customers Summary */}
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h2 className="text-lg font-bold mb-2">ملخص حسابات العملاء</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">عدد العملاء</div>
                    <div className="text-xl font-bold">{clients?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">إجمالي المديونية</div>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(
                        clients?.reduce(
                          (sum: number, client: any) => 
                            sum + (parseFloat(client.balance) > 0 ? parseFloat(client.balance) : 0),
                          0
                        ) || 0
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">إجمالي الرصيد الدائن</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(
                        clients?.reduce(
                          (sum: number, client: any) => 
                            sum + (parseFloat(client.balance) < 0 ? -parseFloat(client.balance) : 0),
                          0
                        ) || 0
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Reports;