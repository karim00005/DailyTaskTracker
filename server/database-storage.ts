import { db } from "./db";
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
import { IStorage } from "./storage";
import { eq, and } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    return result[0];
  }

  async getClientByName(name: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.name, name));
    return result[0];
  }

  async createClient(client: InsertClient): Promise<Client> {
    const result = await db.insert(clients).values(client).returning();
    return result[0];
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const result = await db.update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.count > 0;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.code, code));
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(productData)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.count > 0;
  }

  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;

    const currentQuantity = parseFloat(product.stockQuantity.toString());
    const updatedQuantity = currentQuantity + quantity;

    const result = await db.update(products)
      .set({ stockQuantity: updatedQuantity.toString() })
      .where(eq(products.id, id))
      .returning();

    return result[0];
  }

  // Warehouse operations
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async getWarehouse(id: number): Promise<Warehouse | undefined> {
    const result = await db.select().from(warehouses).where(eq(warehouses.id, id));
    return result[0];
  }

  async getDefaultWarehouse(): Promise<Warehouse | undefined> {
    const result = await db.select().from(warehouses).where(eq(warehouses.isDefault, true));
    return result[0];
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    // If this warehouse is set as default, make sure only one is default
    if (warehouse.isDefault) {
      await db.update(warehouses)
        .set({ isDefault: false })
        .where(eq(warehouses.isDefault, true));
    }

    const result = await db.insert(warehouses).values(warehouse).returning();
    return result[0];
  }

  async updateWarehouse(id: number, warehouseData: Partial<Warehouse>): Promise<Warehouse | undefined> {
    // If updated to be default, update other warehouses
    if (warehouseData.isDefault) {
      await db.update(warehouses)
        .set({ isDefault: false })
        .where(
          eq(warehouses.isDefault, true)
        );
    }

    const result = await db.update(warehouses)
      .set(warehouseData)
      .where(eq(warehouses.id, id))
      .returning();
    
    return result[0];
  }

  async deleteWarehouse(id: number): Promise<boolean> {
    // Don't allow deleting the default warehouse
    const warehouse = await this.getWarehouse(id);
    if (warehouse && warehouse.isDefault) {
      return false;
    }

    const result = await db.delete(warehouses).where(eq(warehouses.id, id));
    return result.count > 0;
  }

  // Invoice operations
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.invoiceNumber, invoiceNumber));
    return result[0];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(invoice).returning();
    return result[0];
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    
    return result[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // First delete related invoice items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    // Then delete the invoice
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.count > 0;
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
  }

  async getInvoicesByType(invoiceType: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.invoiceType, invoiceType));
  }

  // Invoice Items operations
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(invoiceItem).returning();
    return result[0];
  }

  async updateInvoiceItem(id: number, invoiceItemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const result = await db.update(invoiceItems)
      .set(invoiceItemData)
      .where(eq(invoiceItems.id, id))
      .returning();
    
    return result[0];
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const result = await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return result.count > 0;
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0];
  }

  async getTransactionByNumber(transactionNumber: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.transactionNumber, transactionNumber));
    return result[0];
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions)
      .set(transactionData)
      .where(eq(transactions.id, id))
      .returning();
    
    return result[0];
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.count > 0;
  }

  async getTransactionsByClient(clientId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.clientId, clientId));
  }

  async getTransactionsByType(transactionType: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.transactionType, transactionType));
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    const results = await db.select().from(settings);
    return results[0];
  }

  async updateSettings(settingsData: Partial<Settings>): Promise<Settings | undefined> {
    const existingSettings = await this.getSettings();
    
    if (existingSettings) {
      // Update existing settings
      const result = await db.update(settings)
        .set(settingsData)
        .where(eq(settings.id, existingSettings.id))
        .returning();
      
      return result[0];
    } else {
      // Create new settings if none exist
      const result = await db.insert(settings)
        .values(settingsData as any) // Force cast since we need all required fields
        .returning();
      
      return result[0];
    }
  }
}