import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronRight, 
  Plus, 
  Save, 
  Printer, 
  FileText, 
  RefreshCcw
} from 'lucide-react';

import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import Spinner from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';

import { useAppContext } from '@/context/AppContext';

function PurchaseInvoice() {
  const { setCurrentModule } = useAppContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const isEditing = Boolean(params.id);
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceType: 'شراء',
    date: new Date(),
    clientId: '',
    warehouseId: '',
    items: [{ productId: '', quantity: 1, price: 0, discount: 0, total: 0 }],
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
    total: 0,
    paid: 0,
    due: 0,
    notes: '',
    status: 'معلق'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set current module on component mount
  useEffect(() => {
    setCurrentModule('purchases');
  }, [setCurrentModule]);

  // Fetch clients (suppliers)
  const { 
    data: clients = [], 
    isLoading: isLoadingClients 
  } = useQuery({ 
    queryKey: ['/api/clients'],
    select: (data) => data.filter((client: any) => client.type === 'مورد')
  });

  // Fetch products
  const { 
    data: products = [], 
    isLoading: isLoadingProducts 
  } = useQuery({ 
    queryKey: ['/api/products'] 
  });

  // Fetch warehouses
  const { 
    data: warehouses = [], 
    isLoading: isLoadingWarehouses 
  } = useQuery({ 
    queryKey: ['/api/warehouses'] 
  });

  // Fetch invoice if editing
  const { 
    data: invoice, 
    isLoading: isLoadingInvoice 
  } = useQuery({
    queryKey: ['/api/invoices', params.id],
    enabled: isEditing,
    queryFn: async () => {
      const response = await fetch(`/api/invoices/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      return response.json();
    },
    onSuccess: (data) => {
      const invoiceItems = [];
      
      // Fetch invoice items
      fetch(`/api/invoices/${params.id}/items`)
        .then(res => res.json())
        .then(items => {
          // If we have items, use them, otherwise use default empty item
          if (items && items.length > 0) {
            invoiceItems.push(...items.map((item: any) => ({
              id: item.id,
              productId: item.productId.toString(),
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              total: item.total
            })));
          } else {
            invoiceItems.push({ productId: '', quantity: 1, price: 0, discount: 0, total: 0 });
          }
          
          setFormData({
            ...data,
            clientId: data.clientId?.toString() || '',
            warehouseId: data.warehouseId?.toString() || '',
            date: new Date(data.date),
            items: invoiceItems
          });
        })
        .catch(err => {
          console.error('Error fetching invoice items:', err);
          toast({
            title: 'خطأ',
            description: 'حدث خطأ أثناء تحميل تفاصيل الفاتورة',
            variant: 'destructive'
          });
        });
    }
  });

  // Find default warehouse when list is loaded
  useEffect(() => {
    if (warehouses.length > 0 && !formData.warehouseId) {
      const defaultWarehouse = warehouses.find((wh: any) => wh.isDefault);
      setFormData(prev => ({
        ...prev,
        warehouseId: defaultWarehouse ? defaultWarehouse.id.toString() : warehouses[0].id.toString()
      }));
    }
  }, [warehouses, formData.warehouseId]);

  // Calculate totals when items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity) * (1 - Number(item.discount) / 100)), 0);
    const totalAfterDiscount = subtotal * (1 - Number(formData.discount) / 100);
    const totalAfterTax = totalAfterDiscount * (1 + Number(formData.tax) / 100);
    const total = totalAfterTax + Number(formData.shipping || 0);
    const due = Math.max(0, total - Number(formData.paid || 0));
    
    setFormData(prev => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      due: parseFloat(due.toFixed(2))
    }));
  }, [formData.items, formData.discount, formData.tax, formData.shipping, formData.paid]);

  // Update item row totals when item details change
  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...formData.items];
    
    // Update the field
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // If it's price, quantity, or discount, recalculate the total
    if (['price', 'quantity', 'discount'].includes(field)) {
      const price = Number(updatedItems[index].price);
      const quantity = Number(updatedItems[index].quantity);
      const discount = Number(updatedItems[index].discount);
      
      const total = price * quantity * (1 - discount / 100);
      updatedItems[index].total = parseFloat(total.toFixed(2));
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Add a new empty row
  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, price: 0, discount: 0, total: 0 }]
    }));
  };

  // Remove an item row
  const removeItemRow = (index: number) => {
    if (formData.items.length === 1) {
      // Don't remove the last row, just clear it
      setFormData(prev => ({
        ...prev,
        items: [{ productId: '', quantity: 1, price: 0, discount: 0, total: 0 }]
      }));
      return;
    }
    
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Handle product selection to auto-populate price
  const handleProductSelect = (index: number, productId: string) => {
    if (!productId) return;
    
    const product = products.find((p: any) => p.id.toString() === productId);
    if (product) {
      const updatedItems = [...formData.items];
      updatedItems[index] = {
        ...updatedItems[index],
        productId,
        price: product.purchasePrice || 0,
        total: product.purchasePrice * updatedItems[index].quantity * (1 - updatedItems[index].discount / 100)
      };
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار المورد',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.warehouseId) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار المخزن',
        variant: 'destructive'
      });
      return;
    }
    
    if (!formData.items[0].productId) {
      toast({
        title: 'خطأ',
        description: 'يرجى إضافة منتج واحد على الأقل',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for submission
      const invoiceData = {
        ...formData,
        date: formData.date.toISOString(),
        clientId: parseInt(formData.clientId),
        warehouseId: parseInt(formData.warehouseId)
      };
      
      // Remove items from invoice data (they will be submitted separately)
      const { items, ...invoiceWithoutItems } = invoiceData;
      
      let response;
      
      if (isEditing) {
        // Update existing invoice
        response = await fetch(`/api/invoices/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceWithoutItems)
        });
      } else {
        // Create new invoice
        response = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceWithoutItems)
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} invoice`);
      }
      
      const savedInvoice = await response.json();
      const invoiceId = savedInvoice.id;
      
      // Now save the invoice items
      if (isEditing) {
        // For existing invoices, handle updates and deletions of items
        for (const item of items) {
          if (item.id) {
            // Update existing item
            await fetch(`/api/invoices/${invoiceId}/items/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...item,
                productId: parseInt(item.productId),
                invoiceId
              })
            });
          } else if (item.productId) {
            // Create new item
            await fetch(`/api/invoices/${invoiceId}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...item,
                productId: parseInt(item.productId),
                invoiceId
              })
            });
          }
        }
      } else {
        // For new invoices, just create all items
        for (const item of items) {
          if (item.productId) {
            await fetch(`/api/invoices/${invoiceId}/items`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...item,
                productId: parseInt(item.productId),
                invoiceId
              })
            });
          }
        }
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: 'تم بنجاح',
        description: `تم ${isEditing ? 'تحديث' : 'إنشاء'} فاتورة المشتريات بنجاح`
      });
      
      // Redirect back to invoices list
      navigate('/purchases');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'خطأ',
        description: `حدث خطأ أثناء ${isEditing ? 'تحديث' : 'إنشاء'} الفاتورة`,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while fetching data
  if ((isEditing && isLoadingInvoice) || isLoadingClients || isLoadingProducts || isLoadingWarehouses) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => navigate('/purchases')}
        >
          <ChevronRight className="h-4 w-4 ml-1" />
          <span>العودة</span>
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'تعديل فاتورة مشتريات' : 'فاتورة مشتريات جديدة'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">رقم الفاتورة</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={e => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="رقم الفاتورة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">التاريخ</Label>
                    <DatePicker
                      date={formData.date}
                      setDate={(date) => setFormData(prev => ({ ...prev, date: date || new Date() }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client">المورد</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={value => setFormData(prev => ({ ...prev, clientId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المورد" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warehouse">المخزن</Label>
                  <Select
                    value={formData.warehouseId}
                    onValueChange={value => setFormData(prev => ({ ...prev, warehouseId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المخزن" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">الحالة</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="حالة الفاتورة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="معلق">معلق</SelectItem>
                      <SelectItem value="مكتمل">مكتمل</SelectItem>
                      <SelectItem value="ملغي">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subtotal">المجموع</Label>
                    <Input
                      id="subtotal"
                      value={formData.subtotal}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">الخصم (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={e => setFormData(prev => ({ ...prev, discount: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax">الضريبة (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      min="0"
                      value={formData.tax}
                      onChange={e => setFormData(prev => ({ ...prev, tax: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping">الشحن</Label>
                    <Input
                      id="shipping"
                      type="number"
                      min="0"
                      value={formData.shipping}
                      onChange={e => setFormData(prev => ({ ...prev, shipping: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total">الإجمالي</Label>
                    <Input
                      id="total"
                      value={formData.total}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paid">المدفوع</Label>
                    <Input
                      id="paid"
                      type="number"
                      min="0"
                      value={formData.paid}
                      onChange={e => setFormData(prev => ({ ...prev, paid: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">المتبقي</Label>
                    <Input
                      id="due"
                      value={formData.due}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات إضافية..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-md border p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">أصناف الفاتورة</h2>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addItemRow}
              className="space-x-1 space-x-reverse"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة صنف</span>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>المنتج</TableHead>
                  <TableHead className="w-[120px]">الكمية</TableHead>
                  <TableHead className="w-[150px]">السعر</TableHead>
                  <TableHead className="w-[120px]">الخصم (%)</TableHead>
                  <TableHead className="w-[150px]">الإجمالي</TableHead>
                  <TableHead className="w-[80px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Select
                        value={item.productId}
                        onValueChange={value => handleProductSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={e => handleItemChange(index, 'price', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={item.discount}
                        onChange={e => handleItemChange(index, 'discount', Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemRow(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/purchases')}
          >
            إلغاء
          </Button>
          
          <div className="flex space-x-2 space-x-reverse">
            {isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => window.print()} 
                className="space-x-1 space-x-reverse"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة</span>
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="space-x-1 space-x-reverse"
            >
              {isSubmitting ? (
                <RefreshCcw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isEditing ? 'تحديث الفاتورة' : 'حفظ الفاتورة'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default PurchaseInvoice;