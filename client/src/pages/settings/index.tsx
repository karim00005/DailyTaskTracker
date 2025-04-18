import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsType } from "@shared/schema";

const settingsMenu = [
  { name: "users", icon: "user" },
  { name: "package", icon: "box" },
  { name: "file-text", icon: "file" },
  { name: "repeat", icon: "refresh" },
];

const Settings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Settings state
  const [companyName, setCompanyName] = useState<string>("شركة دريم لإدارة الأعمال"); // closed string correctly
  const [address, setAddress] = useState<string>("14 شارع التحرير، القاهرة");
  const [phone, setPhone] = useState<string>("02-12345678");
  const [mobile, setMobile] = useState<string>("0100-123-4567");
  const [email, setEmail] = useState<string>("info@sahelapp.com");
  const [website, setWebsite] = useState<string>("www.sahelapp.com");
  const [taxNumber, setTaxNumber] = useState<string>("12345678");
  const [commercialRecord, setCommercialRecord] = useState<string>("12345678");
  
  // Get settings data
  const { data: settings, isLoading: isSettingsLoading } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });
  
  // Update settings from API data
  React.useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName || "");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setMobile(settings.mobile || "");
      setEmail(settings.email || "");
      setWebsite(settings.website || "");
      setTaxNumber(settings.taxNumber || "");
      // commercialRecord is not in the Schema, use a custom field
      setCommercialRecord(settings.taxNumber || ""); // Just use tax number for now
    }
  }, [settings]);
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<SettingsType>) => {
      const response = await apiRequest("PUT", "/api/settings", settingsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
      console.error("Settings update error:", error);
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create settings data - only include fields from the schema
    const settingsData: Partial<SettingsType> = {
      companyName,
      address,
      phone,
      mobile,
      email,
      website,
      taxNumber,
      // Exclude commercialRecord as it's not in the schema
    };
    
    updateSettingsMutation.mutate(settingsData);
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">الإعدادات</h1>
      
      <Tabs defaultValue="company">
        <TabsList className="mb-4">
          <TabsTrigger value="company">معلومات الشركة</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
          <TabsTrigger value="users">المستخدمين</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="import">استيراد البيانات</TabsTrigger>
          <TabsTrigger value="export">تصدير البيانات</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company-name">اسم الشركة</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="mobile">رقم الجوال</Label>
                    <Input
                      id="mobile"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="website">الموقع الإلكتروني</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tax-number">الرقم الضريبي</Label>
                    <Input
                      id="tax-number"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="commercial-record">السجل التجاري</Label>
                    <Input
                      id="commercial-record"
                      value={commercialRecord}
                      onChange={(e) => setCommercialRecord(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button type="submit">
                    <Icon name="save" className="ml-2" />
                    حفظ الإعدادات
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="system">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">إعدادات النظام</h2>
              <p className="text-gray-500">هذه الإعدادات قيد التطوير وستكون متاحة في التحديث القادم.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">إدارة المستخدمين</h2>
              <p className="text-gray-500">إدارة المستخدمين قيد التطوير وستكون متاحة في التحديث القادم.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">النسخ الاحتياطي</h2>
              <p className="text-gray-500">يرجى الانتقال إلى صفحة النسخ الاحتياطي من خلال القائمة السفلية.</p>
              
              <div className="flex justify-center mt-6">
                <Button onClick={() => window.location.href = "/settings/backup"}>
                  <Icon name="backup" className="ml-2" />
                  الانتقال لصفحة النسخ الاحتياطي
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">استيراد البيانات</h2>
              <p className="text-gray-500">يمكنك استيراد البيانات من ملفات Excel من خلال هذه الصفحة.</p>
              
              <div className="flex justify-center mt-6">
                <Button onClick={() => window.location.href = "/settings/import"}>
                  <Icon name="import" className="ml-2" />
                  الانتقال لصفحة استيراد البيانات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">تصدير البيانات</h2>
              <p className="text-gray-500">يمكنك تصدير كافة البيانات إلى ملف Excel من خلال هذه الصفحة.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">تصدير جميع البيانات</h3>
                  <p className="text-gray-500 mb-4">تصدير جميع البيانات الموجودة في النظام إلى ملف Excel واحد.</p>
                  <Button className="w-full" onClick={() => window.open('/api/export/excel?type=all', '_blank')}>
                    <Icon name="download" className="ml-2" />
                    تصدير جميع البيانات
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">تصدير بيانات محددة</h3>
                  <p className="text-gray-500 mb-4">يمكنك تصدير فقط البيانات التي تريدها من خلال الخيارات التالية.</p>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('/api/export/excel?type=clients', '_blank')}
                    >
                      <Icon name="users" className="ml-2" />
                      تصدير بيانات العملاء
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('/api/export/excel?type=products', '_blank')}
                    >
                      <Icon name="package" className="ml-2" />
                      تصدير بيانات المنتجات
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('/api/export/excel?type=invoices', '_blank')}
                    >
                      <Icon name="file-text" className="ml-2" />
                      تصدير بيانات الفواتير
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('/api/export/excel?type=transactions', '_blank')}
                    >
                      <Icon name="repeat" className="ml-2" />
                      تصدير بيانات المعاملات المالية
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;