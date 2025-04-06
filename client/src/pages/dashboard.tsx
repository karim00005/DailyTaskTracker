import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icons";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils/format-currency";

const Dashboard: React.FC = () => {
  // Fetch summary data
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: invoices, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Calculate summary statistics
  const totalClients = clients?.length || 0;
  const totalProducts = products?.length || 0;
  
  const totalSales = invoices
    ?.filter((invoice: any) => invoice.invoiceType === "بيع")
    .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.grandTotal), 0) || 0;
  
  const totalPurchases = invoices
    ?.filter((invoice: any) => invoice.invoiceType === "شراء")
    .reduce((sum: number, invoice: any) => sum + parseFloat(invoice.grandTotal), 0) || 0;
  
  const totalReceipts = transactions
    ?.filter((transaction: any) => transaction.transactionType === "قبض")
    .reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount), 0) || 0;
  
  const totalPayments = transactions
    ?.filter((transaction: any) => transaction.transactionType === "صرف")
    .reduce((sum: number, transaction: any) => sum + parseFloat(transaction.amount), 0) || 0;

  // Module items for quick access
  const modules = [
    { title: "بيع جديد", icon: "sales", path: "/sales/invoice", color: "bg-primary" },
    { title: "قبض", icon: "receipt", path: "/treasury/receipt", color: "bg-green-500" },
    { title: "صرف", icon: "payment", path: "/treasury/payment", color: "bg-red-500" },
    { title: "العملاء", icon: "clients", path: "/accounts", color: "bg-blue-500" },
    { title: "المنتجات", icon: "products", path: "/inventory", color: "bg-purple-500" },
    { title: "التقارير", icon: "reports", path: "/reports", color: "bg-yellow-500" },
  ];

  // Show loading state if data is loading
  const isLoading = isClientsLoading || isProductsLoading || isInvoicesLoading || isTransactionsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>

      {/* Quick Access Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {modules.map((module, index) => (
          <Link key={index} href={module.path}>
            <a className="block">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div className={`${module.color} text-white w-12 h-12 rounded-full flex items-center justify-center mb-3`}>
                    <Icon name={module.icon as any} />
                  </div>
                  <h3 className="font-medium">{module.title}</h3>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-800">المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-green-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-800">{formatCurrency(totalSales)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-800">المقبوضات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-blue-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-blue-800">{formatCurrency(totalReceipts)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-800">المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-red-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-red-800">{formatCurrency(totalPayments)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-yellow-800">المشتريات</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 bg-yellow-200 animate-pulse rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-yellow-800">{formatCurrency(totalPurchases)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* More Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إحصائيات عامة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">عدد العملاء:</span>
                <span className="font-bold">{isClientsLoading ? "..." : totalClients}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">عدد المنتجات:</span>
                <span className="font-bold">{isProductsLoading ? "..." : totalProducts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">عدد الفواتير:</span>
                <span className="font-bold">{isInvoicesLoading ? "..." : invoices?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">عدد المعاملات المالية:</span>
                <span className="font-bold">{isTransactionsLoading ? "..." : transactions?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">العمليات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 bg-gray-100 animate-pulse rounded"></div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {invoices?.slice(0, 4).map((invoice: any) => (
                  <Link key={invoice.id} href={`/sales/invoice/${invoice.id}`}>
                    <a className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full ${invoice.invoiceType === "بيع" ? "bg-green-500" : "bg-yellow-500"} mr-2`}></div>
                        <span>{invoice.invoiceType} - {invoice.invoiceNumber}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(invoice.grandTotal)}</span>
                    </a>
                  </Link>
                ))}
                
                {invoices?.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    لا توجد عمليات حديثة
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
