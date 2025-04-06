import {
  users, User, InsertUser,
  clients, Client, InsertClient,
  products, Product, InsertProduct,
  warehouses, Warehouse, InsertWarehouse,
  invoices, Invoice, InsertInvoice,
  invoiceItems, InvoiceItem, InsertInvoiceItem,
  transactions, Transaction, InsertTransaction,
  settings, Settings, InsertSettings
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getClientByName(name: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  updateProductStock(id: number, quantity: number): Promise<Product | undefined>;

  // Warehouse operations
  getWarehouses(): Promise<Warehouse[]>;
  getWarehouse(id: number): Promise<Warehouse | undefined>;
  getDefaultWarehouse(): Promise<Warehouse | undefined>;
  createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse>;
  updateWarehouse(id: number, warehouse: Partial<Warehouse>): Promise<Warehouse | undefined>;
  deleteWarehouse(id: number): Promise<boolean>;

  // Invoice operations
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoicesByType(invoiceType: string): Promise<Invoice[]>;

  // Invoice Items operations
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, invoiceItem: Partial<InvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;

  // Transaction operations
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByNumber(transactionNumber: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  getTransactionsByClient(clientId: number): Promise<Transaction[]>;
  getTransactionsByType(transactionType: string): Promise<Transaction[]>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<Settings>): Promise<Settings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private products: Map<number, Product>;
  private warehouses: Map<number, Warehouse>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private transactions: Map<number, Transaction>;
  private settings: Settings | undefined;

  private currentUserId: number;
  private currentClientId: number;
  private currentProductId: number;
  private currentWarehouseId: number;
  private currentInvoiceId: number;
  private currentInvoiceItemId: number;
  private currentTransactionId: number;
  private currentSettingsId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.products = new Map();
    this.warehouses = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.transactions = new Map();

    this.currentUserId = 1;
    this.currentClientId = 1;
    this.currentProductId = 1;
    this.currentWarehouseId = 1;
    this.currentInvoiceId = 1;
    this.currentInvoiceItemId = 1;
    this.currentTransactionId = 1;
    this.currentSettingsId = 1;

    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData(): void {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "كريم كمال",
      role: "admin",
      isActive: true
    });

    // Create default warehouse
    this.createWarehouse({
      name: "المخزن الرئيسي",
      address: "المقر الرئيسي",
      isDefault: true,
      isActive: true
    });

    // Create default settings
    this.settings = {
      id: this.currentSettingsId++,
      companyName: "شركة الرازقي لتوزيع المواد الغذائية",
      address: "14 عمارات المرور صلاح سالم",
      phone: "0123456789",
      mobile: "01008779000",
      email: "info@company.com",
      website: "www.company.com",
      taxNumber: "12345678",
      currency: "جنيه مصري",
      currencySymbol: "ج.م",
      decimalPlaces: 2,
      backupPath: "D:\\SAHL Backups\\",
      cloudBackupPath: ""
    };

    // Create sample clients
    this.createClient({
      name: "محمد عبدالله حسين عبدالعظيم",
      type: "عميل",
      accountType: "مدين",
      code: "C001",
      taxId: "",
      balance: "0",
      address: "88 شارع صدقي",
      city: "طنطا",
      phone: "",
      mobile: "01099998017",
      email: "",
      notes: "",
      isActive: true
    });

    this.createClient({
      name: "جلال البيه",
      type: "عميل",
      accountType: "مدين",
      code: "C002",
      taxId: "",
      balance: "0",
      address: "المعادي",
      city: "القاهرة",
      phone: "",
      mobile: "01234567890",
      email: "",
      notes: "",
      isActive: true
    });

    // Create sample products
    this.createProduct({
      code: "P001",
      name: "شركة الدلتا للسكر",
      description: "سكر أبيض",
      unitOfMeasure: "كج",
      category: "مواد غذائية",
      costPrice: "25000",
      sellPrice1: "29200",
      sellPrice2: "28000",
      sellPrice3: "27000",
      stockQuantity: "500",
      reorderLevel: "50",
      isActive: true
    });

    // Create sample invoices
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    this.createInvoice({
      invoiceNumber: "1610",
      invoiceType: "بيع",
      clientId: 1,
      warehouseId: 1,
      date: formattedDate,
      time: `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`,
      paymentMethod: "آجل",
      userId: 1,
      total: "1460000",
      discount: "0",
      tax: "0",
      grandTotal: "1460000",
      paid: "0",
      balance: "1460000",
      notes: ""
    });

    // Create invoice items
    this.createInvoiceItem({
      invoiceId: 1,
      productId: 1,
      quantity: "50",
      unitPrice: "29200",
      discount: "0",
      tax: "0",
      total: "1460000"
    });

    // Create sample transactions
    this.createTransaction({
      transactionNumber: "1523",
      transactionType: "قبض",
      clientId: 1,
      date: formattedDate,
      time: `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`,
      amount: "1460000",
      paymentMethod: "بنك مصر",
      reference: "",
      bank: "بنك مصر",
      notes: "سداد فاتورة رقم 1610",
      userId: 1
    });

    this.createTransaction({
      transactionNumber: "207",
      transactionType: "صرف",
      clientId: 2,
      date: formattedDate,
      time: `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`,
      amount: "100000",
      paymentMethod: "بنك مصر",
      reference: "",
      bank: "بنك مصر",
      notes: "مصاريف تشغيلية",
      userId: 1
    });
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.name === name
    );
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const newClient: Client = { ...client, id };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;

    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(
      (product) => product.code === code
    );
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const currentQuantity = parseFloat(product.stockQuantity.toString());
    const updatedQuantity = currentQuantity + quantity;

    const updatedProduct = { 
      ...product, 
      stockQuantity: updatedQuantity.toString() 
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    return Array.from(this.warehouses.values());
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    return this.warehouses.get(id);
  }

  async getDefaultWarehouse(): Promise<Warehouse | undefined> {
    return Array.from(this.warehouses.values()).find(
      (warehouse) => warehouse.isDefault
    );
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const id = this.currentWarehouseId++;
    const newWarehouse: Warehouse = { ...warehouse, id };
    
    // If this is the first warehouse or set as default, make sure only one is default
    if (newWarehouse.isDefault) {
      for (const [wId, w] of this.warehouses.entries()) {
        if (w.isDefault) {
          this.warehouses.set(wId, { ...w, isDefault: false });
        }
      }
    }
    
    this.warehouses.set(id, newWarehouse);
    return newWarehouse;
  }

  async updateWarehouse(id: number, warehouseData: Partial<Warehouse>): Promise<Warehouse | undefined> {
    const warehouse = this.warehouses.get(id);
    if (!warehouse) return undefined;

    const updatedWarehouse = { ...warehouse, ...warehouseData };
    
    // If updated to be default, update other warehouses
    if (warehouseData.isDefault) {
      for (const [wId, w] of this.warehouses.entries()) {
        if (wId !== id && w.isDefault) {
          this.warehouses.set(wId, { ...w, isDefault: false });
        }
      }
    }
    
    this.warehouses.set(id, updatedWarehouse);
    return updatedWarehouse;
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    const warehouse = this.warehouses.get(id);
    
    // Don't allow deleting the default warehouse
    if (warehouse && warehouse.isDefault) {
      return false;
    }
    
    return this.warehouses.delete(id);
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(
      (invoice) => invoice.invoiceNumber === invoiceNumber
    );
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const now = new Date();
    const newInvoice: Invoice = { 
      ...invoice, 
      id,
      createdAt: now
    };
    
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;

    const updatedInvoice = { ...invoice, ...invoiceData };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Also delete related invoice items
    const items = await this.getInvoiceItems(id);
    for (const item of items) {
      await this.deleteInvoiceItem(item.id);
    }
    
    return this.invoices.delete(id);
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.clientId === clientId
    );
  }

  async getInvoicesByType(invoiceType: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.invoiceType === invoiceType
    );
  }

  // Invoice Items operations
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(
      (item) => item.invoiceId === invoiceId
    );
  }

  async createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.currentInvoiceItemId++;
    const newInvoiceItem: InvoiceItem = { ...invoiceItem, id };
    
    this.invoiceItems.set(id, newInvoiceItem);
    
    // Update product stock
    const product = await this.getProduct(invoiceItem.productId);
    const invoice = await this.getInvoice(invoiceItem.invoiceId);
    
    if (product && invoice) {
      const quantity = parseFloat(invoiceItem.quantity.toString());
      
      // Decrease stock for sales, increase for purchases
      let stockChange = 0;
      if (invoice.invoiceType === "بيع" || invoice.invoiceType === "مرتجع شراء") {
        stockChange = -quantity;
      } else if (invoice.invoiceType === "شراء" || invoice.invoiceType === "مرتجع بيع") {
        stockChange = quantity;
      }
      
      await this.updateProductStock(product.id, stockChange);
    }
    
    return newInvoiceItem;
  }

  async updateInvoiceItem(id: number, invoiceItemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const invoiceItem = this.invoiceItems.get(id);
    if (!invoiceItem) return undefined;

    // Handle stock changes if quantity changed
    if (invoiceItemData.quantity && invoiceItemData.quantity !== invoiceItem.quantity) {
      const product = await this.getProduct(invoiceItem.productId);
      const invoice = await this.getInvoice(invoiceItem.invoiceId);
      
      if (product && invoice) {
        const oldQuantity = parseFloat(invoiceItem.quantity.toString());
        const newQuantity = parseFloat(invoiceItemData.quantity.toString());
        const quantityDiff = newQuantity - oldQuantity;
        
        // Adjust stock based on invoice type
        let stockChange = 0;
        if (invoice.invoiceType === "بيع" || invoice.invoiceType === "مرتجع شراء") {
          stockChange = -quantityDiff;
        } else if (invoice.invoiceType === "شراء" || invoice.invoiceType === "مرتجع بيع") {
          stockChange = quantityDiff;
        }
        
        await this.updateProductStock(product.id, stockChange);
      }
    }

    const updatedInvoiceItem = { ...invoiceItem, ...invoiceItemData };
    this.invoiceItems.set(id, updatedInvoiceItem);
    return updatedInvoiceItem;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const invoiceItem = this.invoiceItems.get(id);
    if (!invoiceItem) return false;
    
    // Reverse stock changes
    const product = await this.getProduct(invoiceItem.productId);
    const invoice = await this.getInvoice(invoiceItem.invoiceId);
    
    if (product && invoice) {
      const quantity = parseFloat(invoiceItem.quantity.toString());
      
      // Add back to stock for sales, remove for purchases
      let stockChange = 0;
      if (invoice.invoiceType === "بيع" || invoice.invoiceType === "مرتجع شراء") {
        stockChange = quantity;
      } else if (invoice.invoiceType === "شراء" || invoice.invoiceType === "مرتجع بيع") {
        stockChange = -quantity;
      }
      
      await this.updateProductStock(product.id, stockChange);
    }
    
    return this.invoiceItems.delete(id);
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByNumber(transactionNumber: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (transaction) => transaction.transactionNumber === transactionNumber
    );
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const newTransaction: Transaction = { 
      ...transaction, 
      id,
      createdAt: now
    };
    
    this.transactions.set(id, newTransaction);
    
    // Update client balance
    const client = await this.getClient(transaction.clientId);
    if (client) {
      const amount = parseFloat(transaction.amount.toString());
      const balance = parseFloat(client.balance.toString());
      
      let newBalance = balance;
      if (transaction.transactionType === "قبض") {
        newBalance -= amount;
      } else if (transaction.transactionType === "صرف") {
        newBalance += amount;
      }
      
      await this.updateClient(client.id, { balance: newBalance.toString() });
    }
    
    return newTransaction;
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    // Handle amount changes for client balance
    if (transactionData.amount && transactionData.amount !== transaction.amount) {
      const client = await this.getClient(transaction.clientId);
      if (client) {
        const oldAmount = parseFloat(transaction.amount.toString());
        const newAmount = parseFloat(transactionData.amount.toString());
        const amountDiff = newAmount - oldAmount;
        
        const balance = parseFloat(client.balance.toString());
        let newBalance = balance;
        
        if (transaction.transactionType === "قبض") {
          newBalance -= amountDiff;
        } else if (transaction.transactionType === "صرف") {
          newBalance += amountDiff;
        }
        
        await this.updateClient(client.id, { balance: newBalance.toString() });
      }
    }

    const updatedTransaction = { ...transaction, ...transactionData };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    
    // Reverse client balance changes
    const client = await this.getClient(transaction.clientId);
    if (client) {
      const amount = parseFloat(transaction.amount.toString());
      const balance = parseFloat(client.balance.toString());
      
      let newBalance = balance;
      if (transaction.transactionType === "قبض") {
        newBalance += amount;
      } else if (transaction.transactionType === "صرف") {
        newBalance -= amount;
      }
      
      await this.updateClient(client.id, { balance: newBalance.toString() });
    }
    
    return this.transactions.delete(id);
  }

  async getTransactionsByClient(clientId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.clientId === clientId
    );
  }

  async getTransactionsByType(transactionType: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.transactionType === transactionType
    );
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(settingsData: Partial<Settings>): Promise<Settings | undefined> {
    if (!this.settings) {
      this.settings = {
        id: this.currentSettingsId++,
        companyName: "شركة الرازقي لتوزيع المواد الغذائية",
        address: "",
        phone: "",
        mobile: "",
        email: "",
        website: "",
        taxNumber: "",
        currency: "جنيه مصري",
        currencySymbol: "ج.م",
        decimalPlaces: 2,
        backupPath: "",
        cloudBackupPath: "",
        ...settingsData
      };
      return this.settings;
    }

    this.settings = { ...this.settings, ...settingsData };
    return this.settings;
  }
}

export const storage = new MemStorage();
