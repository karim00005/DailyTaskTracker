import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/components/icons";
import { useQuery } from "@tanstack/react-query";
import { formatDateArabic } from "@/lib/utils/arabic-date";

const Backup: React.FC = () => {
  const { toast } = useToast();
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
  
  // Get backup history (mock data for now)
  const backupHistory = [
    { id: 1, fileName: 'backup_2023-08-15.zip', date: new Date('2023-08-15'), size: '1.2 MB' },
    { id: 2, fileName: 'backup_2023-08-10.zip', date: new Date('2023-08-10'), size: '1.1 MB' },
    { id: 3, fileName: 'backup_2023-08-05.zip', date: new Date('2023-08-05'), size: '1.0 MB' },
  ];
  
  // Create backup function
  const handleCreateBackup = () => {
    setIsBackupInProgress(true);
    
    // Simulate backup process
    setTimeout(() => {
      setIsBackupInProgress(false);
      
      toast({
        title: "تم إنشاء النسخة الاحتياطية",
        description: "تم إنشاء النسخة الاحتياطية بنجاح",
      });
    }, 2000);
  };
  
  // Restore backup function
  const handleRestoreBackup = (backupId: number) => {
    if (confirm("هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.")) {
      setIsRestoreInProgress(true);
      
      // Simulate restore process
      setTimeout(() => {
        setIsRestoreInProgress(false);
        
        toast({
          title: "تم استعادة النسخة الاحتياطية",
          description: "تم استعادة النسخة الاحتياطية بنجاح",
        });
      }, 3000);
    }
  };
  
  // Download backup function
  const handleDownloadBackup = (fileName: string) => {
    toast({
      title: "جاري التحميل",
      description: `جاري تحميل ${fileName}`,
    });
  };
  
  // Delete backup function
  const handleDeleteBackup = (backupId: number) => {
    if (confirm("هل أنت متأكد من حذف هذه النسخة الاحتياطية؟")) {
      toast({
        title: "تم الحذف",
        description: "تم حذف النسخة الاحتياطية بنجاح",
      });
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">النسخ الاحتياطي</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">إنشاء نسخة احتياطية</h2>
            <p className="text-gray-600 mb-4">
              قم بإنشاء نسخة احتياطية من جميع بيانات النظام. يُنصح بعمل نسخة احتياطية بشكل دوري.
            </p>
            
            <Button 
              onClick={handleCreateBackup}
              disabled={isBackupInProgress}
              className="w-full"
            >
              {isBackupInProgress ? (
                <>
                  <div className="animate-spin mr-2">
                    <Icon name="loading" />
                  </div>
                  جاري إنشاء النسخة الاحتياطية...
                </>
              ) : (
                <>
                  <Icon name="backup" className="ml-2" />
                  إنشاء نسخة احتياطية جديدة
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">استعادة نسخة احتياطية</h2>
            <p className="text-gray-600 mb-4">
              قم باستعادة نسخة احتياطية سابقة. سيؤدي هذا إلى استبدال جميع البيانات الحالية.
            </p>
            
            <div className="flex items-center">
              <input
                type="file"
                id="backup-file"
                className="hidden"
                accept=".zip,.json"
              />
              <label
                htmlFor="backup-file"
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full ${isRestoreInProgress ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isRestoreInProgress ? (
                  <>
                    <div className="animate-spin mr-2">
                      <Icon name="loading" />
                    </div>
                    جاري استعادة النسخة الاحتياطية...
                  </>
                ) : (
                  <>
                    <Icon name="restore" className="ml-2" />
                    اختر ملف النسخة الاحتياطية
                  </>
                )}
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">النسخ الاحتياطية السابقة</h2>
          
          {backupHistory.length > 0 ? (
            <div className="border rounded-md">
              <div className="grid grid-cols-4 gap-4 bg-muted p-3 font-medium">
                <div>التاريخ</div>
                <div>اسم الملف</div>
                <div>الحجم</div>
                <div>الإجراءات</div>
              </div>
              
              {backupHistory.map((backup) => (
                <div key={backup.id} className="grid grid-cols-4 gap-4 p-3 border-t">
                  <div>{formatDateArabic(backup.date)}</div>
                  <div>{backup.fileName}</div>
                  <div>{backup.size}</div>
                  <div className="flex space-x-2 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestoreBackup(backup.id)}
                      disabled={isRestoreInProgress}
                    >
                      <Icon name="restore" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadBackup(backup.fileName)}
                    >
                      <Icon name="download" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteBackup(backup.id)}
                    >
                      <Icon name="delete" size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              لا توجد نسخ احتياطية سابقة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Backup;