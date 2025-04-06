import React, { createContext, useState, useContext, useEffect } from 'react';

export type ModuleType = 'dashboard' | 'sales' | 'accounts' | 'inventory' | 'treasury' | 'settings';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  mobile: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  user: User | null;
  currentModule: ModuleType;
  setCurrentModule: (module: ModuleType) => void;
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
  isRightSidebarOpen: boolean;
  toggleRightSidebar: () => void;
  isModalOpen: boolean;
  openModal: (modalContent: React.ReactNode) => void;
  closeModal: () => void;
  modalContent: React.ReactNode;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default true for simplicity
  const [user, setUser] = useState<User | null>({
    id: 1,
    username: 'admin',
    fullName: 'كريم كمال',
    role: 'admin'
  });
  const [currentModule, setCurrentModule] = useState<ModuleType>('dashboard');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'شركة الرازقي لتوزيع المواد الغذائية',
    address: '14 عمارات المرور صلاح سالم',
    phone: '0123456789',
    mobile: '01008779000'
  });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);

  const login = async (username: string, password: string) => {
    try {
      // In a real app, make an API call here
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('فشل تسجيل الدخول');
      }

      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  const openModal = (content: React.ReactNode) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Fetch company info on load
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setCompanyInfo({
            name: data.companyName,
            address: data.address || '',
            phone: data.phone || '',
            mobile: data.mobile || ''
          });
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    };

    fetchCompanyInfo();
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        user,
        currentModule,
        setCurrentModule,
        companyInfo,
        setCompanyInfo,
        isRightSidebarOpen,
        toggleRightSidebar,
        isModalOpen,
        openModal,
        closeModal,
        modalContent
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
