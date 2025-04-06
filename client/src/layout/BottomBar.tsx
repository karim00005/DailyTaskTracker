import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';
import { Icon } from '@/components/icons';

const BottomBar: React.FC = () => {
  const [location] = useLocation();
  const { openModal } = useAppContext();
  
  // Determine if we're on a page that needs specific actions
  const showSalesInvoiceActions = location.includes('/sales/invoice');
  const showBackupAction = location.includes('/settings');
  
  const handleOpenBackupModal = () => {
    // Import the backup component dynamically to avoid circular dependencies
    import('@/pages/settings/backup').then((module) => {
      const BackupModal = module.default;
      openModal(<BackupModal />);
    });
  };
  
  const handleOpenSettingsModal = () => {
    // Import the settings component dynamically to avoid circular dependencies
    import('@/pages/settings/index').then((module) => {
      const SettingsModal = module.default;
      openModal(<SettingsModal />);
    });
  };

  return (
    <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 p-2 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Left Actions */}
          <div className="flex space-x-2 space-x-reverse">
            <button className="btn-gray">
              <Icon name="logout" className="ml-1" size={18} />
              إغلاق
            </button>
            <button className="btn-gray" onClick={handleOpenSettingsModal}>
              <Icon name="settings" className="ml-1" size={18} />
              إعدادات
            </button>
            {showBackupAction && (
              <button className="btn-gray" onClick={handleOpenBackupModal}>
                <Icon name="backup" className="ml-1" size={18} />
                نسخة احتياطية
              </button>
            )}
          </div>
          
          {/* Center Actions - conditional based on page */}
          {showSalesInvoiceActions ? (
            <div className="flex space-x-2 space-x-reverse">
              <button className="btn-danger">
                <Icon name="delete" className="ml-1" size={18} />
                حذف الفاتورة
              </button>
              <button className="btn-warning">
                <Icon name="edit" className="ml-1" size={18} />
                تعديل الأسعار
              </button>
              <button className="btn-warning">
                <Icon name="print" className="ml-1" size={18} />
                طباعة الفاتورة
              </button>
            </div>
          ) : (
            <div></div> // Empty div to maintain the three-column layout
          )}
          
          {/* Right Actions - always show at least some common actions */}
          <div className="flex space-x-2 space-x-reverse">
            <button className="btn-primary">
              <Icon name="save" className="ml-1" size={18} />
              حفظ
            </button>
            {showSalesInvoiceActions && (
              <button className="btn-secondary">
                <Icon name="add" className="ml-1" size={18} />
                جديد
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
