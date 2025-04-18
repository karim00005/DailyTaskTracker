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
import SalesBatch from "@/pages/sales/batch";
import Accounts from "@/pages/accounts";
import ClientDetails from "@/pages/accounts/client-details";
import ClientBatch from "@/pages/accounts/batch";
import Inventory from "@/pages/inventory";
import ProductBatch from "@/pages/inventory/batch";
import Purchases from "@/pages/purchases";
import PurchaseInvoice from "@/pages/purchases/invoice";
import Receipt from "@/pages/treasury/receipt";
import Payment from "@/pages/treasury/payment";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Backup from "./pages/settings/backup";
import Import from "./pages/settings/import";
import { useEffect } from "react";
import { useAppContext, AppProvider } from "./context/AppContext";

function Router() {
  const { setCurrentModule } = useAppContext();
  
  useEffect(() => {
    // Set active module based on path
    const path = window.location.pathname;
    if (path.includes('/sales')) {
      setCurrentModule('sales');
    } else if (path.includes('/purchases')) {
      setCurrentModule('purchases');
    } else if (path.includes('/accounts')) {
      setCurrentModule('accounts');
    } else if (path.includes('/inventory')) {
      setCurrentModule('inventory');
    } else if (path.includes('/treasury')) {
      setCurrentModule('treasury');
    } else if (path.includes('/reports')) {
      setCurrentModule('reports');
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
        <Route path="/sales/batch" component={SalesBatch} />
        <Route path="/purchases" component={Purchases} />
        <Route path="/purchases/invoice" component={PurchaseInvoice} />
        <Route path="/purchases/invoice/:id" component={PurchaseInvoice} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/accounts/client/:id" component={ClientDetails} />
        <Route path="/accounts/batch" component={ClientBatch} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/inventory/batch" component={ProductBatch} />
        <Route path="/treasury/receipt" component={Receipt} />
        <Route path="/treasury/payment" component={Payment} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings/backup" component={Backup} />
        <Route path="/settings/import" component={Import} />
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
