import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAppContext } from '@/context/AppContext';

interface NavItem {
  title: string;
  path: string;
  module: string;
}

const navItems: NavItem[] = [
  { title: 'ابدأ من هنا', path: '/', module: 'dashboard' },
  { title: 'الفواتير', path: '/sales', module: 'sales' },
  { title: 'المبيعات', path: '/sales', module: 'sales' },
  { title: 'المخزون', path: '/inventory', module: 'inventory' },
  { title: 'الحسابات', path: '/accounts', module: 'accounts' },
  { title: 'تقارير', path: '/reports', module: 'reports' },
  { title: 'الخدمات', path: '/services', module: 'services' },
  { title: 'المساعدة', path: '/help', module: 'help' }
];

const Header: React.FC = () => {
  const { user, logout, companyInfo, currentModule } = useAppContext();
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="bg-primary text-white h-8 w-8 flex items-center justify-center rounded-md">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold">دريم لإدارة الأعمال
</h1>
              <div className="text-xs text-gray-500">شركة: {companyInfo.name}</div>
            </div>
          </div>
          
          {/* User Info */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="text-sm">
              <span className="text-gray-500">المستخدم:</span>
              <span className="font-medium">{user?.fullName}</span>
            </div>
            <button 
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-md text-sm flex items-center"
            >
              <i className="fas fa-sign-out-alt ml-1"></i> إغلاق
            </button>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="mt-2">
          <ul className="flex border-b border-gray-200">
            {navItems.map((item, index) => (
              <li key={index} className={index > 0 ? "" : "mr-1"}>
                <Link href={item.path}>
                  <div className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 ${
                    (currentModule === item.module) 
                      ? "border-primary text-primary" 
                      : "border-transparent hover:border-primary hover:text-primary"
                  } transition-colors cursor-pointer`}>
                    {item.title}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
