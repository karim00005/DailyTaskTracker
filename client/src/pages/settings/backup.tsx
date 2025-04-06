import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/icons";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

const Backup: React.FC = () => {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle backup creation
  const handleCreateBackup = async () => {
    try {
      toast({
        title: "جاري إنشاء نسخة احتياطية",
        description: "يرجى الانتظار...",
      });

      const response = await apiRequest("GET", "/api/backup/create", null);
      
      if (!response.ok) {
        throw new Error("فشل إنشاء النسخة الاحتياطية");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      // Create filename with current date and time
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '-');
      const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
      const filename = `sahl1-${dateStr}-${timeStr}.SahlBackup3`;
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم إنشاء النسخة الاحتياطية بنجاح",
        description: "تم تنزيل الملف على جهازك",
      });
    } catch (error) {
      console.error("Backup creation error:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    }
  };

  // Handle file selection for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.SahlBackup3')) {
        setBackupFile(file);
        setRestoreDialogOpen(true);
      } else {
        toast({
          title: "خطأ",
          description: "الملف المختار ليس ملف نسخة احتياطية صحيح. يجب أن ينتهي بـ .SahlBackup3",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Handle restore confirmation
  const handleRestoreConfirm = async () => {
    if (!backupFile) return;
    
    setIsRestoring(true);
    setRestoreResult(null);
    
    try {
      const formData = new FormData();
      formData.append('backupFile', backupFile);
      
      const response = await apiRequest("POST", "/api/backup/restore", formData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشلت عملية استعادة النسخة الاحتياطية");
      }
      
      const result = await response.json();
      
      setRestoreResult({
        success: true,
        message: "تمت استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تشغيل التطبيق خلال 3 ثوان."
      });
      
      // Reload the application after 3 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      
    } catch (error: any) {
      console.error("Restore error:", error);
      setRestoreResult({
        success: false,
        message: error.message || "حدث خطأ أثناء استعادة النسخة الاحتياطية"
      });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Close dialog and reset state
  const handleCloseDialog = () => {
    setRestoreDialogOpen(false);
    setBackupFile(null);
    setRestoreResult(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">النسخ الاحتياطي واستعادة البيانات</h1>
        <Button variant="outline" onClick={() => navigate("/settings")}>
          <Icon name="prev" className="ml-1" size={16} />
          الرجوع للإعدادات
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">إنشاء نسخة احتياطية</h2>
            <p className="text-gray-600 mb-6">
              قم بإنشاء نسخة احتياطية من جميع بيانات النظام. يمكنك استخدام هذه النسخة لاستعادة البيانات في حالة فقدانها.
            </p>
            
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4 ml-2" />
              <AlertTitle>ملاحظة هامة</AlertTitle>
              <AlertDescription>
                تأكد من الاحتفاظ بالنسخ الاحتياطية في مكان آمن.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button onClick={handleCreateBackup}>
                <Icon name="backup" className="ml-2" size={16} />
                إنشاء نسخة احتياطية
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Restore Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">استعادة البيانات</h2>
            <p className="text-gray-600 mb-6">
              استعادة بيانات النظام من نسخة احتياطية سابقة. سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية.
            </p>
            
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4 ml-2" />
              <AlertTitle>تحذير!</AlertTitle>
              <AlertDescription>
                سيؤدي استعادة النسخة الاحتياطية إلى حذف جميع بياناتك الحالية واستبدالها بالبيانات من النسخة الاحتياطية.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                className="relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept=".SahlBackup3"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
                <Icon name="restore" className="ml-2" size={16} />
                استعادة نسخة احتياطية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Restore confirmation dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد استعادة النسخة الاحتياطية</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من استعادة النسخة الاحتياطية؟ سيتم حذف جميع البيانات الحالية واستبدالها بالبيانات من النسخة الاحتياطية.
            </DialogDescription>
          </DialogHeader>
          
          {restoreResult ? (
            <div className={`p-4 rounded-md ${restoreResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center">
                {restoreResult.success ? (
                  <CheckCircle className="h-6 w-6 text-green-500 ml-2" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-500 ml-2" />
                )}
                <div className="font-semibold">
                  {restoreResult.success ? 'تمت العملية بنجاح' : 'حدث خطأ'}
                </div>
              </div>
              <p className="mt-2">{restoreResult.message}</p>
            </div>
          ) : (
            <>
              <div className="py-4">
                <p>اسم الملف: {backupFile?.name}</p>
                <p>حجم الملف: {backupFile ? (backupFile.size / 1024).toFixed(2) + ' كيلوبايت' : ''}</p>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseDialog} disabled={isRestoring}>
                  إلغاء
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRestoreConfirm} 
                  disabled={isRestoring}
                >
                  {isRestoring ? 'جاري الاستعادة...' : 'تأكيد الاستعادة'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Backup;