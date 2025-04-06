import React from 'react';
import {
  ShoppingCart,
  File,
  CreditCard,
  Repeat,
  Tag,
  ClipboardCheck,
  Receipt,
  DollarSign,
  Package,
  ArrowRightLeft,
  Settings,
  LogOut,
  Save,
  Plus,
  Minus,
  Trash,
  Edit,
  Printer,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  Check,
  X,
  Calendar,
  Clock,
  BarChart2,
  Users,
  Server,
  Download,
  Upload,
  Database,
  Home,
  Loader
} from "lucide-react";

export type IconName = 
  | 'sales'
  | 'salesReturn'
  | 'quotation'
  | 'purchase'
  | 'purchaseReturn'
  | 'receipt'
  | 'payment'
  | 'inventory'
  | 'transfer'
  | 'settings'
  | 'logout'
  | 'save'
  | 'add'
  | 'remove'
  | 'delete'
  | 'edit'
  | 'print'
  | 'search'
  | 'next'
  | 'prev'
  | 'first'
  | 'last'
  | 'check'
  | 'close'
  | 'calendar'
  | 'time'
  | 'reports'
  | 'clients'
  | 'products'
  | 'backup'
  | 'restore'
  | 'database'
  | 'home'
  | 'loading'
  | 'download'
  | 'import';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, ...rest }) => {
  const iconMap: Record<IconName, React.ReactNode> = {
    sales: <File size={size} />,
    salesReturn: <Repeat size={size} />,
    quotation: <Tag size={size} />,
    purchase: <ShoppingCart size={size} />,
    purchaseReturn: <ClipboardCheck size={size} />,
    receipt: <Receipt size={size} />,
    payment: <DollarSign size={size} />,
    inventory: <Package size={size} />,
    transfer: <ArrowRightLeft size={size} />,
    settings: <Settings size={size} />,
    logout: <LogOut size={size} />,
    save: <Save size={size} />,
    add: <Plus size={size} />,
    remove: <Minus size={size} />,
    delete: <Trash size={size} />,
    edit: <Edit size={size} />,
    print: <Printer size={size} />,
    search: <Search size={size} />,
    next: <ChevronLeft size={size} />,
    prev: <ChevronRight size={size} />,
    first: <ChevronsRight size={size} />,
    last: <ChevronsLeft size={size} />,
    check: <Check size={size} />,
    close: <X size={size} />,
    calendar: <Calendar size={size} />,
    time: <Clock size={size} />,
    reports: <BarChart2 size={size} />,
    clients: <Users size={size} />,
    products: <Server size={size} />,
    backup: <Download size={size} />,
    restore: <Upload size={size} />,
    database: <Database size={size} />,
    home: <Home size={size} />,
    loading: <Loader size={size} />,
    download: <Download size={size} />,
    import: <Upload size={size} />
  };

  return (
    <span className="inline-flex">
      {iconMap[name]}
    </span>
  );
};
