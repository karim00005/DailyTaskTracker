import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerAr } from "@/components/ui/date-picker-ar";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils/format-currency";
import { useLocation } from "wouter";

const Payment: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get URL parameters
  const params = new URLSearchParams(location.split("?")[1]);
  const clientIdParam = params.get("clientId");
  
  // Payment state
  const [transactionNumber, setTransactionNumber] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [clientId, setClientId] = useState<string>(clientIdParam || "");
  const [clientName, setClientName] = useState<string>("");
  const [amount, setAmount] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<string>("نقدي");
  const [bank, setBank] = useState<string>("بنك مصر");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [printAfterSave, setPrintAfterSave] = useState<boolean>(false);
  
  // Load data
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
  });
  
  // Client details for balance, etc.
  const { data: selectedClient, isLoading: isClientLoading } = useQuery({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });
  
  // Set transaction number
  useEffect(() => {
    if (transactions) {
      const paymentTransactions = transactions.filter((tr: any) => tr.transactionType === "صرف");
      const lastTransaction = paymentTransactions[paymentTransactions.length - 1];
      const lastNumber = lastTransaction ? parseInt(lastTransaction.transactionNumber) : 0;
      setTransactionNumber((lastNumber + 1).toString());
    }
  }, [transactions]);
  
  // Set client name when client is selected
  useEffect(() => {
    if (clientId && clients) {
      const client = clients.find((c: any) => c.id.toString() === clientId);
      if (client) {
        setClientName(client.name);
      }
    }
  }, [clientId, clients]);
  
  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await apiRequest("POST", "/api/transactions", transactionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "تم إنشاء سند الصرف",
        description: "تم إنشاء سند الصرف بنجاح",
      });
      
      // Reset form
      setClientId("");
      setClientName("");
      setAmount("0");
      setReference("");
      setNotes("");
      setCategory("");
      
      // Set new transaction number
      if (transactions) {
        const newNumber = parseInt(transactionNumber) + 1;
        setTransactionNumber(newNumber.toString());
      }
      
      // Handle printing
      if (printAfterSave) {
        handlePrint();
      }
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء سند الصرف",
        variant: "destructive",
      });
      console.error("Transaction creation error:", error);
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار حساب",
        variant: "destructive",
      });
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }
    
    // Create transaction
    const paymentNotes = category ? `${category}: ${notes}` : notes;
    
    const transactionData = {
      transactionNumber,
      transactionType: "صرف",
      clientId: parseInt(clientId),
      date: date.toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
      amount,
      paymentMethod,
      reference,
      bank: paymentMethod === "نقدي" ? "" : bank,
      notes: paymentNotes,
      userId: 1, // Current user ID
    };
    
    createTransactionMutation.mutate(transactionData);
  };
  
  // Handle printing
  const handlePrint = () => {
    // In a real app, implement actual printing logic
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">سند صرف</h1>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <Icon name="prev" className="ml-1" size={16} />
          العودة
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Header */}
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="transaction-number">رقم السند</Label>
                    <Input
                      id="transaction-number"
                      value={transactionNumber}
                      onChange={(e) => setTransactionNumber(e.target.value)}
                      className="bg-red-50 border-red-300"
                    />
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <DatePickerAr date={date} setDate={setDate} />
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="client">الحساب</Label>
                  <div className="relative">
                    <Input
                      id="client"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="اختر الحساب"
                      list="clients-list"
                    />
                    <datalist id="clients-list">
                      {clients?.map((client: any) => (
                        <option key={client.id} value={client.name} data-id={client.id} />
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
                        } else {
                          toast({
                            title: "تنبيه",
                            description: "الحساب غير موجود، يرجى إنشاء حساب جديد أو اختيار حساب موجود",
                          });
                        }
                      }}
                    >
                      <Icon name="search" size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg font-bold"
                  />
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="category">بند المصروف</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="اختر بند المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">بدون تصنيف</SelectItem>
                      <SelectItem value="إيجارات">إيجارات</SelectItem>
                      <SelectItem value="رواتب">رواتب</SelectItem>
                      <SelectItem value="صيانة">صيانة</SelectItem>
                      <SelectItem value="مرافق">مرافق (كهرباء، مياه، الخ)</SelectItem>
                      <SelectItem value="مستلزمات مكتبية">مستلزمات مكتبية</SelectItem>
                      <SelectItem value="تسويق">تسويق وإعلان</SelectItem>
                      <SelectItem value="نثريات">نثريات</SelectItem>
                      <SelectItem value="ضرائب">ضرائب ورسوم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Client Info and Payment */}
              <div>
                {clientId && selectedClient ? (
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <h3 className="font-bold mb-2">معلومات الحساب</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">نوع الحساب:</span>
                        <span className="mr-1">{selectedClient.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">الرصيد:</span>
                        <span className={`mr-1 font-bold ${
                          parseFloat(selectedClient.balance) > 0 ? "text-red-600" : "text-green-600"
                        }`}>
                          {formatCurrency(selectedClient.balance)}
                        </span>
                      </div>
                      
                      {selectedClient.mobile && (
                        <div>
                          <span className="text-gray-500">الجوال:</span>
                          <span className="mr-1">{selectedClient.mobile}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : isClientLoading ? (
                  <div className="bg-gray-50 p-4 rounded-md mb-4 animate-pulse h-28"></div>
                ) : null}
                
                <div className="mb-4">
                  <Label htmlFor="payment-method">طريقة السداد</Label>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={(value) => {
                      setPaymentMethod(value);
                      if (value === "نقدي") {
                        setBank("");
                      }
                    }}
                  >
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="اختر طريقة السداد" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نقدي">نقدي</SelectItem>
                      <SelectItem value="شيك">شيك</SelectItem>
                      <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                      <SelectItem value="بطاقة ائتمان">بطاقة ائتمان</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {paymentMethod !== "نقدي" && (
                  <>
                    <div className="mb-4">
                      <Label htmlFor="bank">البنك</Label>
                      <Select value={bank} onValueChange={setBank}>
                        <SelectTrigger id="bank">
                          <SelectValue placeholder="اختر البنك" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="بنك مصر">بنك مصر</SelectItem>
                          <SelectItem value="البنك الأهلي">البنك الأهلي</SelectItem>
                          <SelectItem value="بنك القاهرة">بنك القاهرة</SelectItem>
                          <SelectItem value="بنك QNB">بنك QNB</SelectItem>
                          <SelectItem value="بنك CIB">بنك CIB</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="reference">رقم المرجع / الشيك</Label>
                      <Input
                        id="reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="رقم المرجع أو الشيك"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات (اختياري)"
                />
              </div>
              
              {/* Print Checkbox */}
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="print-after-save"
                  checked={printAfterSave}
                  onChange={(e) => setPrintAfterSave(e.target.checked)}
                  className="form-checkbox ml-2"
                />
                <Label htmlFor="print-after-save">طباعة بعد الحفظ</Label>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/accounts")}
              >
                إلغاء
              </Button>
              
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                >
                  <Icon name="print" className="ml-1" size={16} />
                  معاينة وطباعة
                </Button>
                
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Icon name="save" className="ml-1" size={16} />
                  {createTransactionMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Print Preview (hidden from normal view, shown during print) */}
      <div className="hidden print:block">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">سند صرف</h1>
          <p className="text-lg">شركة الرازقي لتوزيع المواد الغذائية</p>
          <p>14 عمارات المرور صلاح سالم</p>
          <p>01008779000</p>
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="font-bold">رقم السند:</div>
              <div>{transactionNumber}</div>
            </div>
            <div>
              <div className="font-bold">التاريخ:</div>
              <div>{date.toLocaleDateString('ar-EG')}</div>
            </div>
            <div>
              <div className="font-bold">الحساب:</div>
              <div>{clientName}</div>
            </div>
            <div>
              <div className="font-bold">طريقة السداد:</div>
              <div>{paymentMethod}</div>
            </div>
            
            {category && (
              <div>
                <div className="font-bold">بند المصروف:</div>
                <div>{category}</div>
              </div>
            )}
            
            {paymentMethod !== "نقدي" && (
              <>
                <div>
                  <div className="font-bold">البنك:</div>
                  <div>{bank}</div>
                </div>
                {reference && (
                  <div>
                    <div className="font-bold">رقم المرجع:</div>
                    <div>{reference}</div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="border-t-2 border-b-2 border-gray-300 py-4 my-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-bold">المبلغ رقماً:</div>
                <div className="text-xl font-bold">{formatCurrency(amount)}</div>
              </div>
              <div>
                <div className="font-bold">المبلغ كتابةً:</div>
                <div className="text-xl">
                  {/* In a real app, implement a function to convert numbers to Arabic words */}
                  {amount ? "فقط " + amount + " جنيهاً مصرياً لا غير" : ""}
                </div>
              </div>
            </div>
          </div>
          
          {notes && (
            <div className="mb-4">
              <div className="font-bold">ملاحظات:</div>
              <div>{notes}</div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="text-center">
              <div className="font-bold mb-8">المستلم</div>
              <div>.................................................</div>
            </div>
            <div className="text-center">
              <div className="font-bold mb-8">المدير المالي</div>
              <div>.................................................</div>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>تم إصدار هذا السند بواسطة نظام سهل لإدارة الأعمال</p>
          <p>{new Date().toLocaleDateString('ar-EG')} {new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
      </div>
    </div>
  );
};

export default Payment;
