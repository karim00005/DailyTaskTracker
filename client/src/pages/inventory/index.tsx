import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format-currency";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Define the form schema
const productFormSchema = z.object({
  code: z.string().min(1, { message: "كود المنتج مطلوب" }),
  name: z.string().min(3, { message: "اسم المنتج يجب أن يكون على الأقل 3 أحرف" }),
  unitOfMeasure: z.string().min(1, { message: "وحدة القياس مطلوبة" }),
  description: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.string().min(1, { message: "سعر التكلفة مطلوب" }),
  sellPrice1: z.string().min(1, { message: "سعر البيع مطلوب" }),
  sellPrice2: z.string().optional(),
  sellPrice3: z.string().optional(),
  stockQuantity: z.string().default("0"),
  reorderLevel: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const Inventory: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState<boolean>(false);
  
  // New product dialog state
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState<boolean>(false);
  
  // Product details dialog state
  const [isProductDetailsDialogOpen, setIsProductDetailsDialogOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  
  // Get products data
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["/api/products"],
  });
  
  // Get warehouses data
  const { data: warehouses } = useQuery({
    queryKey: ["/api/warehouses"],
  });
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormValues) => {
      const response = await apiRequest("POST", "/api/products", productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsNewProductDialogOpen(false);
      
      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive",
      });
      console.error("Product creation error:", error);
    },
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: number, productData: Partial<ProductFormValues> }) => {
      const response = await apiRequest("PUT", `/api/products/${id}`, productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDetailsDialogOpen(false);
      
      toast({
        title: "تم تحديث المنتج",
        description: "تم تحديث بيانات المنتج بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive",
      });
      console.error("Product update error:", error);
    },
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });
      
      setIsProductDetailsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المنتج",
        variant: "destructive",
      });
      console.error("Product deletion error:", error);
    },
  });
  
  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number, quantity: number }) => {
      const product = products.find((p: any) => p.id === id);
      const newQuantity = parseFloat(product.stockQuantity) + quantity;
      
      const response = await apiRequest("PUT", `/api/products/${id}`, { 
        stockQuantity: newQuantity.toString() 
      });
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "تم تحديث المخزون",
        description: "تم تحديث المخزون بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المخزون",
        variant: "destructive",
      });
      console.error("Stock update error:", error);
    },
  });
  
  // Form for new product
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: "",
      name: "",
      unitOfMeasure: "طن",
      costPrice: "0",
      sellPrice1: "0",
      stockQuantity: "0",
      isActive: true,
    },
  });
  
  // Form for edit product
  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      code: "",
      name: "",
      unitOfMeasure: "طن",
      costPrice: "0",
      sellPrice1: "0",
      stockQuantity: "0",
      isActive: true,
    },
  });
  
  // Set edit form values when selected product changes
  React.useEffect(() => {
    if (selectedProduct) {
      editForm.reset(selectedProduct);
    }
  }, [selectedProduct, editForm]);
  
  // Handle form submission for new product
  const onSubmit = (data: ProductFormValues) => {
    createProductMutation.mutate(data);
  };
  
  // Handle form submission for edit product
  const onEditSubmit = (data: ProductFormValues) => {
    if (selectedProduct) {
      updateProductMutation.mutate({ id: selectedProduct.id, productData: data });
    }
  };
  
  // Filter products
  const filteredProducts = Array.isArray(products)
    ? products.filter((product) => product.category === filterCategory)
    : [];
  
  // Handle product details view
  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setIsProductDetailsDialogOpen(true);
  };
  
  // Handle delete product
  const handleDeleteProduct = () => {
    if (selectedProduct && confirm(`هل أنت متأكد من حذف المنتج "${selectedProduct.name}"؟`)) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };
  
  // Handle add stock
  const [stockQuantity, setStockQuantity] = useState<string>("0");
  
  const handleAddStock = () => {
    if (selectedProduct) {
      const quantity = parseFloat(stockQuantity);
      if (isNaN(quantity)) {
        toast({
          title: "خطأ",
          description: "الرجاء إدخال كمية صحيحة",
          variant: "destructive",
        });
        return;
      }
      
      addStockMutation.mutate({ id: selectedProduct.id, quantity });
      setStockQuantity("0");
    }
  };
  
  // Get unique categories
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    products?.forEach((product: any) => {
      if (product.category) {
        categorySet.add(product.category);
      }
    });
    return Array.from(categorySet);
  }, [products]);
  
  // Product columns for DataTable
  const productColumns = [
    {
      key: "#",
      header: "#",
      cell: (_: any, index: number) => index + 1,
    },
    {
      key: "code",
      header: "الكود",
      cell: (row: any) => row.code,
      sortable: true,
    },
    {
      key: "name",
      header: "اسم المنتج",
      cell: (row: any) => (
        <div className="cursor-pointer" onClick={() => handleViewProduct(row)}>
          <div className="font-medium hover:text-primary">{row.name}</div>
          <div className="text-xs text-gray-500">{row.description || ""}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "الفئة",
      cell: (row: any) => row.category || "—",
      sortable: true,
    },
    {
      key: "unitOfMeasure",
      header: "وحدة",
      cell: (row: any) => row.unitOfMeasure,
      sortable: true,
    },
    {
      key: "costPrice",
      header: "سعر التكلفة",
      cell: (row: any) => formatCurrency(row.costPrice),
      sortable: true,
    },
    {
      key: "sellPrice1",
      header: "سعر البيع",
      cell: (row: any) => formatCurrency(row.sellPrice1),
      sortable: true,
    },
    {
      key: "stockQuantity",
      header: "المخزون",
      cell: (row: any) => {
        const quantity = parseFloat(row.stockQuantity);
        const reorderLevel = row.reorderLevel ? parseFloat(row.reorderLevel) : null;
        
        return (
          <span className={`font-medium ${
            reorderLevel !== null && quantity <= reorderLevel 
              ? "text-red-600" 
              : quantity === 0 
                ? "text-orange-600" 
                : ""
          }`}>
            {quantity}
          </span>
        );
      },
      sortable: true,
      footer: (data: any[]) => {
        const totalItems = data.reduce((sum, row) => sum + parseFloat(row.stockQuantity), 0);
        return <span className="font-bold">{totalItems}</span>;
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
            onClick={() => handleViewProduct(row)}
          >
            <Icon name="edit" size={18} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">المخزون</h1>
        <Button onClick={() => setIsNewProductDialogOpen(true)}>
          <Icon name="add" className="ml-1" size={16} />
          منتج جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="text-blue-800 font-medium mb-1">إجمالي المنتجات</div>
            <div className="text-2xl font-bold text-blue-800">{products?.length || 0}</div>
            <div className="text-sm text-blue-600 mt-1">منتج مسجل</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="text-green-800 font-medium mb-1">منتجات متوفرة</div>
            <div className="text-2xl font-bold text-green-800">
              {products?.filter((p: any) => parseFloat(p.stockQuantity) > 0).length || 0}
            </div>
            <div className="text-sm text-green-600 mt-1">بكمية أكبر من صفر</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="text-red-800 font-medium mb-1">منتجات نفذت</div>
            <div className="text-2xl font-bold text-red-800">
              {products?.filter((p: any) => parseFloat(p.stockQuantity) === 0).length || 0}
            </div>
            <div className="text-sm text-red-600 mt-1">يجب إعادة التخزين</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-yellow-800 font-medium mb-1">منتجات وصلت للحد الأدنى</div>
            <div className="text-2xl font-bold text-yellow-800">
              {products?.filter((p: any) => 
                p.reorderLevel && 
                parseFloat(p.stockQuantity) > 0 && 
                parseFloat(p.stockQuantity) <= parseFloat(p.reorderLevel)
              ).length || 0}
            </div>
            <div className="text-sm text-yellow-600 mt-1">تحتاج إلى طلب</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">فلترة المنتجات</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="mb-1 block">بحث</Label>
              <Input
                id="search"
                placeholder="بحث بالاسم أو الكود"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="category-filter" className="mb-1 block">الفئة</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse mt-6">
              <Checkbox
                id="low-stock"
                checked={showLowStock}
                onCheckedChange={(checked) => setShowLowStock(checked as boolean)}
              />
              <Label htmlFor="low-stock">إظهار المنتجات التي وصلت للحد الأدنى فقط</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs defaultValue="all">
          <div className="flex justify-between items-center p-4 border-b">
            <TabsList>
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="in-stock">متوفر</TabsTrigger>
              <TabsTrigger value="low-stock">حد أدنى</TabsTrigger>
              <TabsTrigger value="out-of-stock">نفذ</TabsTrigger>
            </TabsList>
            
            <Button variant="outline" onClick={() => setIsNewProductDialogOpen(true)}>
              <Icon name="add" className="ml-1" size={16} />
              منتج جديد
            </Button>
          </div>
          
          <TabsContent value="all" className="p-0">
            <DataTable
              columns={productColumns}
              data={filteredProducts}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isProductsLoading}
              onRowClick={handleViewProduct}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="text-5xl text-gray-300 mb-3">
                    <Icon name="products" size={48} />
                  </div>
                  <p className="text-gray-500 mb-6">لا توجد منتجات للعرض</p>
                  <Button onClick={() => setIsNewProductDialogOpen(true)}>
                    <Icon name="add" className="ml-1" size={16} />
                    إضافة منتج جديد
                  </Button>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="in-stock" className="p-0">
            <DataTable
              columns={productColumns}
              data={filteredProducts.filter((p: any) => parseFloat(p.stockQuantity) > 0)}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isProductsLoading}
              onRowClick={handleViewProduct}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا توجد منتجات متوفرة للعرض</p>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="low-stock" className="p-0">
            <DataTable
              columns={productColumns}
              data={filteredProducts.filter((p: any) => 
                p.reorderLevel && 
                parseFloat(p.stockQuantity) > 0 && 
                parseFloat(p.stockQuantity) <= parseFloat(p.reorderLevel)
              )}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isProductsLoading}
              onRowClick={handleViewProduct}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا توجد منتجات وصلت للحد الأدنى للعرض</p>
                </div>
              }
            />
          </TabsContent>
          
          <TabsContent value="out-of-stock" className="p-0">
            <DataTable
              columns={productColumns}
              data={filteredProducts.filter((p: any) => parseFloat(p.stockQuantity) === 0)}
              showFooter={true}
              withPagination={true}
              withSearch={false}
              isLoading={isProductsLoading}
              onRowClick={handleViewProduct}
              emptyState={
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-500">لا توجد منتجات نفذت للعرض</p>
                </div>
              }
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* New Product Dialog */}
      <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>كود المنتج</FormLabel>
                      <FormControl>
                        <Input placeholder="كود المنتج" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المنتج</FormLabel>
                      <FormControl>
                        <Input placeholder="اسم المنتج" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وحدة القياس</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر وحدة القياس" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="طن">طن</SelectItem>
                          <SelectItem value="كج">كيلو جرام</SelectItem>
                          <SelectItem value="متر">متر</SelectItem>
                          <SelectItem value="لتر">لتر</SelectItem>
                          <SelectItem value="عبوة">عبوة</SelectItem>
                          <SelectItem value="كرتون">كرتون</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الفئة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة (اختياري)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">بدون فئة</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                          <SelectItem value="مواد غذائية">مواد غذائية</SelectItem>
                          <SelectItem value="منظفات">منظفات</SelectItem>
                          <SelectItem value="أدوات منزلية">أدوات منزلية</SelectItem>
                          <SelectItem value="إلكترونيات">إلكترونيات</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر التكلفة</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellPrice1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر البيع</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellPrice2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر البيع 2 (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellPrice3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سعر البيع 3 (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المخزون الحالي</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reorderLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حد إعادة الطلب (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        يتم التنبيه عند وصول المخزون لهذه الكمية
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وصف المنتج (اختياري)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>منتج نشط</FormLabel>
                      <FormDescription>
                        تعطيل المنتج يمنع ظهوره في قوائم البيع
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">
                  {createProductMutation.isPending ? "جاري الحفظ..." : "حفظ المنتج"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={isProductDetailsDialogOpen} onOpenChange={setIsProductDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>تفاصيل المنتج: {selectedProduct.name}</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">التفاصيل</TabsTrigger>
                <TabsTrigger value="stock" className="flex-1">المخزون</TabsTrigger>
                <TabsTrigger value="prices" className="flex-1">الأسعار</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>كود المنتج</FormLabel>
                            <FormControl>
                              <Input placeholder="كود المنتج" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>اسم المنتج</FormLabel>
                            <FormControl>
                              <Input placeholder="اسم المنتج" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="unitOfMeasure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>وحدة القياس</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر وحدة القياس" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="طن">طن</SelectItem>
                                <SelectItem value="كج">كيلو جرام</SelectItem>
                                <SelectItem value="متر">متر</SelectItem>
                                <SelectItem value="لتر">لتر</SelectItem>
                                <SelectItem value="عبوة">عبوة</SelectItem>
                                <SelectItem value="كرتون">كرتون</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الفئة</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الفئة (اختياري)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">بدون فئة</SelectItem>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                                <SelectItem value="مواد غذائية">مواد غذائية</SelectItem>
                                <SelectItem value="منظفات">منظفات</SelectItem>
                                <SelectItem value="أدوات منزلية">أدوات منزلية</SelectItem>
                                <SelectItem value="إلكترونيات">إلكترونيات</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>وصف المنتج (اختياري)</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-x-reverse">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>منتج نشط</FormLabel>
                              <FormDescription>
                                تعطيل المنتج يمنع ظهوره في قوائم البيع
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="destructive"
                        onClick={handleDeleteProduct}
                      >
                        <Icon name="delete" className="ml-2" size={16} />
                        حذف المنتج
                      </Button>
                      
                      <Button type="submit">
                        {updateProductMutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="stock">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="current-stock">المخزون الحالي</Label>
                      <div className="text-2xl font-bold mt-1">{selectedProduct.stockQuantity} {selectedProduct.unitOfMeasure}</div>
                      
                      {selectedProduct.reorderLevel && (
                        <div className={`text-sm mt-1 ${
                          parseFloat(selectedProduct.stockQuantity) <= parseFloat(selectedProduct.reorderLevel)
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}>
                          {parseFloat(selectedProduct.stockQuantity) <= parseFloat(selectedProduct.reorderLevel)
                            ? "تنبيه: وصل المخزون للحد الأدنى"
                            : "المخزون ضمن المعدل الطبيعي"}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="reorder-level">حد إعادة الطلب</Label>
                      <Input
                        id="reorder-level"
                        type="number"
                        min="0"
                        value={editForm.getValues("reorderLevel") || ""}
                        onChange={(e) => editForm.setValue("reorderLevel", e.target.value)}
                        className="mt-1"
                      />
                      <div className="text-sm text-gray-500 mt-1">
                        يتم التنبيه عند وصول المخزون لهذه الكمية
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-bold mb-3">تعديل المخزون</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="add-stock">إضافة كمية</Label>
                        <div className="flex mt-1">
                          <Input
                            id="add-stock"
                            type="number"
                            min="0"
                            step="0.01"
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                          />
                          <Button
                            onClick={handleAddStock}
                            className="mr-2"
                          >
                            <Icon name="add" className="ml-1" size={16} />
                            إضافة
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="warehouse">المخزن</Label>
                        <Select defaultValue={warehouses?.[0]?.id?.toString()}>
                          <SelectTrigger id="warehouse" className="mt-1">
                            <SelectValue placeholder="اختر المخزن" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses?.map((warehouse: any) => (
                              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                {warehouse.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => updateProductMutation.mutate({ 
                        id: selectedProduct.id, 
                        productData: { 
                          reorderLevel: editForm.getValues("reorderLevel") 
                        }
                      })}
                      className="mt-4"
                    >
                      حفظ التغييرات
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="prices">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cost-price">سعر التكلفة</Label>
                      <Input
                        id="cost-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.getValues("costPrice")}
                        onChange={(e) => editForm.setValue("costPrice", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sell-price1">سعر البيع</Label>
                      <Input
                        id="sell-price1"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.getValues("sellPrice1")}
                        onChange={(e) => editForm.setValue("sellPrice1", e.target.value)}
                        className="mt-1"
                      />
                      
                      {parseFloat(editForm.getValues("costPrice")) > 0 && parseFloat(editForm.getValues("sellPrice1")) > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          هامش الربح: {(
                            ((parseFloat(editForm.getValues("sellPrice1")) - parseFloat(editForm.getValues("costPrice"))) / 
                            parseFloat(editForm.getValues("costPrice"))) * 100
                          ).toFixed(1)}%
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="sell-price2">سعر البيع 2 (اختياري)</Label>
                      <Input
                        id="sell-price2"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.getValues("sellPrice2") || ""}
                        onChange={(e) => editForm.setValue("sellPrice2", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sell-price3">سعر البيع 3 (اختياري)</Label>
                      <Input
                        id="sell-price3"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.getValues("sellPrice3") || ""}
                        onChange={(e) => editForm.setValue("sellPrice3", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => updateProductMutation.mutate({ 
                      id: selectedProduct.id, 
                      productData: { 
                        costPrice: editForm.getValues("costPrice"),
                        sellPrice1: editForm.getValues("sellPrice1"),
                        sellPrice2: editForm.getValues("sellPrice2"),
                        sellPrice3: editForm.getValues("sellPrice3")
                      }
                    })}
                    className="mt-4"
                  >
                    حفظ التغييرات
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Inventory;
