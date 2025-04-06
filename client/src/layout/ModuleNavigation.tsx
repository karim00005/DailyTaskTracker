import React from 'react';
import { Link, useLocation } from 'wouter';
import { Icon, IconName } from '@/components/icons';
import { useAppContext } from '@/context/AppContext';

interface ModuleNavItem {
  title: string;
  path: string;
  icon: IconName;
  module: string;
}

const moduleNavItems: ModuleNavItem[] = [
  { title: 'بيع', path: '/sales/invoice', icon: 'sales', module: 'sales' },
  { title: 'مراجع بيع', path: '/sales/returns', icon: 'salesReturn', module: 'sales' },
  { title: 'عرض أسعار', path: '/sales/quotation', icon: 'quotation', module: 'sales' },
  { title: 'شراء', path: '/purchases/create', icon: 'purchase', module: 'purchases' },
  { title: 'مراجع شراء', path: '/purchases/returns', icon: 'purchaseReturn', module: 'purchases' },
  { title: 'قبض', path: '/treasury/receipt', icon: 'receipt', module: 'treasury' },
  { title: 'صرف', path: '/treasury/payment', icon: 'payment', module: 'treasury' },
  { title: 'جرد مخزون', path: '/inventory/stock-count', icon: 'inventory', module: 'inventory' },
  { title: 'تحويل لمخزن', path: '/inventory/transfer', icon: 'transfer', module: 'inventory' },
  { title: 'تسوية مخزن', path: '/inventory/adjustment', icon: 'inventory', module: 'inventory' }
];

const ModuleNavigation: React.FC = () => {
  const [location] = useLocation();
  const { currentModule } = useAppContext();
  
  // Filter items based on the current module
  const relevantModuleNavItems = moduleNavItems
    .filter(item => 
      item.module === currentModule || 
      item.module === 'treasury' // Always show treasury items as they're commonly used
    );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between">
          {/* Module Navigation */}
          <div className="flex overflow-x-auto pb-2 scrollbar-thin">
            {relevantModuleNavItems.map((item, index) => {
              const isActive = location === item.path;
              
              return (
                <Link href={item.path} key={index}>
                  <div className="module-nav-item cursor-pointer">
                    <div className="flex flex-col items-center text-center p-2">
                      <div className={`module-nav-item-icon ${isActive ? 'module-nav-item-active' : 'module-nav-item-inactive'}`}>
                        <Icon name={item.icon} />
                      </div>
                      <span className="text-xs font-medium">{item.title}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleNavigation;
