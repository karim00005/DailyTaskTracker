import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format-currency";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SalesInvoice: React.FC = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("آجل");
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [saveAndNew, setSaveAndNew] = useState<boolean>(false);
  const [printAfterSave, setPrintAfterSave] = useState<boolean>(false);
  
  // Product input state
  const [productSearch, setProductSearch] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPrice, setUnitPrice] = useState<string>("0");
  const [discount, setDiscount] = useState<string>("0");

  // Invoice items state
  const [items, setItems] = useState<any[]>([]);

  // Fetching data
  const { data: warehouses } = useQuery({
    queryKey: ["/api/warehouses"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Next invoice number
  useEffect(() => {
    if (invoices) {
      const salesInvoices = Array.isArray(invoices) ? invoices.filter((inv) => inv.invoiceType === "بيع") : [];
      const lastInvoice = salesInvoices[salesInvoices.length - 1];
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber) : 0;
      setInvoiceNumber((lastNumber + 1).toString());
    }
  }, [invoices]);

  // Default warehouse
  useEffect(() => {
    if (warehouses && warehouses.length > 0) {
      const defaultWarehouse = warehouses.find((w: any) => w.isDefault);
      if (defaultWarehouse) {
        setWarehouseId(defaultWarehouse.id.toString());
      } else {
        setWarehouseId(warehouses[0].id.toString());
      }
    }
  }, [warehouses]);

  // Search products
  const filteredProducts = productSearch
    ? Array.isArray(products)
      ? products.filter((product: any) =>
          product.name.includes(productSearch) ||
          product.code.includes(productSearch)
        )
      : []
    : [];

  // Handle product selection
  const handleProductSelect = (product: any) => {
    setSelectedProductId(product.id.toString());
    setProductSearch(product.name);
    setUnitPrice(product.sellPrice1);
  };

  // Add item to invoice
  const handleAddItem = () => {
    if (!selectedProductId) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار منتج أولاً",
        variant: "destructive",
      });
      return;
    }

    const product = Array.isArray(products) ? products.find((p) => p.id.toString() === selectedProductId) : null;
    if (!product) {
      toast({
        title: "خطأ",
        description: "المنتج غير موجود",
        variant: "destructive",
      });
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const disc = parseFloat(discount);

    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "خطأ",
        description: "الكمية يجب أن تكون أكبر من 0",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(price) || price <= 0) {
      toast({
        title: "خطأ",
        description: "السعر يجب أن يكون أكبر من 0",
        variant: "destructive",
      });
      return;
    }

    const itemTotal = qty * price - disc;

    const newItem = {
      productId: product.id,
      productName: product.name,
      code: product.code,
      unitOfMeasure: product.unitOfMeasure,
      quantity: qty,
      unitPrice: price,
      discount: disc,
      total: itemTotal,
    };

    setItems([...items, newItem]);
    
    // Reset product input
    setSelectedProductId("");
    setProductSearch("");
    setQuantity("1");
    setUnitPrice("0");
    setDiscount("0");
  };

  // Remove item from invoice
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Create invoice
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoiceData: any) => {
      const response = await apiRequest("POST", "/api/invoices", invoiceData);
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate invoice queries
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      toast({
        title: "تم إنشاء الفاتورة",
        description: `تم إنشاء الفاتورة رقم ${data.invoiceNumber} بنجاح`,
      });

      if (saveAndNew) {
        // Reset form for new invoice
        setItems([]);
        setClientId("");
        setClientName("");
        setNotes("");
        // Auto-increment invoice number
        setInvoiceNumber((parseInt(invoiceNumber) + 1).toString());
      } else {
        // Navigate to invoice details
        navigate(`/sales/invoice/${data.id}`);
      }

      if (printAfterSave) {
        // Handle printing
        window.print();
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الفاتورة",
        variant: "destructive",
      });
      console.error("Invoice creation error:", error);
    },
  });

  // Add items to invoice
  const createInvoiceItemMutation = useMutation({
    mutationFn: async ({ invoiceId, item }: { invoiceId: number; item: any }) => {
      const itemData = {
        invoiceId,
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discount: item.discount.toString(),
        tax: "0",
        total: item.total.toString(),
      };
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/items`, itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة الأصناف للفاتورة",
        variant: "destructive",
      });
      console.error("Invoice item creation error:", error);
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار عميل أولاً",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إضافة صنف واحد على الأقل للفاتورة",
        variant: "destructive",
      });
      return;
    }

    // Calculate totals
    const total = items.reduce((sum, item) => sum + item.total, 0);
    
    // Create invoice
    const invoiceData = {
      invoiceNumber,
      invoiceType: "بيع",
      clientId: parseInt(clientId),
      warehouseId: parseInt(warehouseId),
      date: date.toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
      paymentMethod,
      userId: 1, // Current user ID
      total: total.toString(),
      discount: "0",
      tax: "0",
      grandTotal: total.toString(),
      paid: "0",
      balance: total.toString(),
      notes,
    };

    try {
      const invoice = await createInvoiceMutation.mutateAsync(invoiceData);
      
      // Add all items
      for (const item of items) {
        await createInvoiceItemMutation.mutateAsync({
          invoiceId: invoice.id,
          item,
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
    }
  };

  // Calculate totals
  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">فاتورة بيع جديدة</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          {/* Invoice Header */}
          <div className="col-span-12 lg:col-span-8 bg-green-50 p-4 rounded-md border border-green-200">
            <div className="grid grid-cols-4 gap-4 items-end">
              <div className="col-span-1">
                <Label htmlFor="invoice-number">ف. رقم</Label>
                <Input
                  id="invoice-number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="bg-green-100 border-green-300"
                />
              </div>
              <div className="col-span-1">
                <Label>التاريخ</Label>
                <DatePickerAr date={date} setDate={setDate} />
              </div>
              <div className="col-span-1">
                <Label>الوقت</Label>
                <Input 
                  value={new Date().toLocaleTimeString("ar-EG")}
                  readOnly 
                />
              </div>
              <div className="col-span-1">
                <div className="flex items-center space-x-2 space-x-reverse h-full">
                  <div className="flex items-center">
                    <Checkbox
                      id="save-new"
                      checked={saveAndNew}
                      onCheckedChange={(checked) => setSaveAndNew(checked as boolean)}
                      className="ml-1"
                    />
                    <Label htmlFor="save-new" className="text-sm">حفظ وجديد</Label>
                  </div>
                  <div className="flex items-center">
                    <Checkbox
                      id="print"
                      checked={printAfterSave}
                      onCheckedChange={(checked) => setPrintAfterSave(checked as boolean)}
                      className="ml-1"
                    />
                    <Label htmlFor="print" className="text-sm">طباعة</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="client">الحساب</Label>
                <div className="relative">
                  <Input
                    id="client"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      // Auto-select client ID when name matches exactly
                      const client = clients?.find((c: any) => c.name === e.target.value);
                      if (client) {
                        setClientId(client.id.toString());
                      }
                    }}
                    placeholder="اختر العميل"
                    list="clients-list"
                  />
                  <datalist id="clients-list">
                    {clients?.map((client: any) => (
                      <option key={client.id} value={client.name} />
                    ))}
                  </datalist>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute inset-y-0 left-0 px-2 border-r border-gray-300 rounded-l-md"
                    onClick={() => {
                      const client = clients?.find((c: any) => c.name === clientName);
                      if (client) {
                        setClientId(client.id.toString());
                        toast({
                          title: "تم اختيار الحساب",
                          description: `تم اختيار ${client.name} بنجاح`,
                        });
                      } else {
                        toast({
                          title: "تنبيه",
                          description: "العميل غير موجود، يرجى إنشاء حساب جديد أو اختيار حساب موجود",
                        });
                      }
                    }}
                  >
                    <Icon name="search" size={16} />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div>
                <Button
                  type="button"
                  className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                >
                  <Icon name="search" className="ml-2" />
                  <span className="text-sm font-medium">استعلام</span>
                </Button>
              </div>
              <div>
                <div className="flex items-center bg-gray-100 text-gray-800 p-2 rounded-md">
                  <span className="ml-2 text-sm font-medium">الكمية</span>
                  <span className="font-bold">{quantity}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center bg-gray-100 text-gray-800 p-2 rounded-md">
                  <span className="ml-2 text-sm font-medium">سعر البيع</span>
                  <span className="font-bold">{unitPrice}</span>
                </div>
              </div>
              <div>
                <Button
                  type="button"
                  className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  onClick={handleAddItem}
                >
                  <Icon name="check" className="ml-2" />
                  <span className="text-sm font-medium">أضف</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Invoice Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-green-500 text-white p-4 rounded-t-md flex flex-col items-center justify-center">
              <div className="flex items-center justify-center mb-2">
                <Icon name="sales" size={32} />
              </div>
              <h2 className="text-xl font-bold">سهل</h2>
              <div className="text-center text-sm mt-2">
                <div>بيع</div>
              </div>
            </div>

            <div className="bg-gray-100 p-4 flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <div className="relative w-full">
                  <Input
                    type="text"
                    placeholder="ابحث عن الصنف"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {filteredProducts && filteredProducts.length > 0 && productSearch && (
                    <div className="absolute z-10 w-full bg-white mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map((product: any) => (
                        <div
                          key={product.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleProductSelect(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            كود: {product.code} | سعر: {formatCurrency(product.sellPrice1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-1 space-x-reverse">
                  <Button variant="outline" size="icon">
                    <Icon name="first" size={16} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Icon name="prev" size={16} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Icon name="next" size={16} />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Icon name="last" size={16} />
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="bg-yellow-400 text-yellow-800 hover:bg-yellow-500"
              >
                <Icon name="check" className="ml-2" />
                <span className="font-bold">حفظ / جديد</span>
              </Button>

              <div className="bg-gray-200 p-3 rounded-md flex flex-col space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" className="bg-gray-300 text-gray-700">
                    <Icon name="search" size={16} />
                  </Button>
                  <span className="text-sm font-medium">الكاميرا</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" className="bg-gray-300 text-gray-700">
                    <Icon name="sales" size={16} />
                  </Button>
                  <Input
                    type="number"
                    className="w-full"
                    placeholder="السعر"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" className="bg-gray-300 text-gray-700">
                    <Icon name="add" size={16} />
                  </Button>
                  <Input
                    type="number"
                    className="w-full"
                    placeholder="الكمية"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" className="bg-gray-300 text-gray-700">
                    <Icon name="remove" size={16} />
                  </Button>
                  <Input
                    type="number"
                    className="w-full"
                    placeholder="خصم"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => setItems([])}
                    type="button"
                  >
                    <Icon name="delete" size={16} />
                  </Button>
                  <span className="text-sm font-medium">حذف الكل</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className="col-span-12">
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
                      <TableHead className="w-[80px]">حذف</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <Icon name="search" size={32} className="mb-2 text-gray-400" />
                            <p>ابدأ بالبحث عن صنف بالاسم أو بالكود</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.code}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.unitOfMeasure}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.discount)}</TableCell>
                          <TableCell>{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              type="button"
                            >
                              <Icon name="delete" size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Payment Options */}
          <div className="col-span-12">
            <div className="grid grid-cols-3 gap-4 bg-green-50 p-4 rounded-md">
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="radio"
                    id="payment-credit"
                    checked={paymentMethod === "آجل"}
                    onChange={() => setPaymentMethod("آجل")}
                    className="ml-1"
                  />
                  <label htmlFor="payment-credit" className="text-sm">آجل</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="payment-cash"
                    checked={paymentMethod === "نقدي"}
                    onChange={() => setPaymentMethod("نقدي")}
                    className="ml-1"
                  />
                  <label htmlFor="payment-cash" className="text-sm">نقدي</label>
                </div>
              </div>

              <div className="text-center">
                <div className="font-bold text-xl mb-2">المجموع</div>
                <div className="text-2xl text-primary font-bold">
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <div className="flex justify-end items-center space-x-2 space-x-reverse">
                <Button type="submit" className="btn-primary">
                  <Icon name="save" className="ml-1" size={16} />
                  حفظ
                </Button>
                <Button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    // Reset form
                    setItems([]);
                    setClientId("");
                    setClientName("");
                    setNotes("");
                    setSelectedProductId("");
                    setProductSearch("");
                    setQuantity("1");
                    setUnitPrice("0");
                    setDiscount("0");
                  }}
                >
                  <Icon name="add" className="ml-1" size={16} />
                  جديد
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalesInvoice;
