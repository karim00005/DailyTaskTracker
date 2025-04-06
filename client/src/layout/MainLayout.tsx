import React, { ReactNode } from 'react';
import Header from './Header';
import ModuleNavigation from './ModuleNavigation';
import BottomBar from './BottomBar';
import { useAppContext } from '@/context/AppContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isModalOpen, closeModal, modalContent } = useAppContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ModuleNavigation />
      
      <main className="flex-1 container mx-auto px-4 py-4 mb-16">
        {children}
      </main>
      
      <BottomBar />
      
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] p-0">
          {modalContent}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MainLayout;
