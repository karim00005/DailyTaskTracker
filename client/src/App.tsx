import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "./layout/MainLayout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Sales from "@/pages/sales";
import SalesInvoice from "@/pages/sales/invoice";
import SalesInvoiceDetails from "@/pages/sales/invoice-details";
import Accounts from "@/pages/accounts";
import ClientDetails from "@/pages/accounts/client-details";
import Inventory from "@/pages/inventory";
import Receipt from "@/pages/treasury/receipt";
import Payment from "@/pages/treasury/payment";
import Settings from "@/pages/settings";
import Backup from "@/pages/settings/backup";
import { useEffect } from "react";
import { useAppContext, AppProvider } from "./context/AppContext";

function Router() {
  const { setCurrentModule } = useAppContext();
  
  useEffect(() => {
    // Set active module based on path
    const path = window.location.pathname;
    if (path.includes('/sales')) {
      setCurrentModule('sales');
    } else if (path.includes('/accounts')) {
      setCurrentModule('accounts');
    } else if (path.includes('/inventory')) {
      setCurrentModule('inventory');
    } else if (path.includes('/treasury')) {
      setCurrentModule('treasury');
    } else if (path.includes('/settings')) {
      setCurrentModule('settings');
    } else {
      setCurrentModule('dashboard');
    }
  }, [setCurrentModule]);

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales/invoice" component={SalesInvoice} />
        <Route path="/sales/invoice/:id" component={SalesInvoiceDetails} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/accounts/client/:id" component={ClientDetails} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/treasury/receipt" component={Receipt} />
        <Route path="/treasury/payment" component={Payment} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings/backup" component={Backup} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router />
        <Toaster />
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
