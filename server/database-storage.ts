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
    const userData = {
      ...user,
      isActive: user.isActive ? 1 : 0, // Convert boolean to 0 or 1
    };
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const updateData: Partial<User> = {
      ...userData,
      isActive: userData.isActive !== undefined ? (userData.isActive ? 1 : 0) : userData.isActive, // Convert boolean to 0 or 1 if provided
    };
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.changes > 0;
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
    const processedClient = {
      ...client,
      balance: client.balance !== undefined ? Number(client.balance) : 0,
      createdAt: client.createdAt instanceof Date ? client.createdAt : new Date(client.createdAt || Date.now()),
      updatedAt: client.updatedAt instanceof Date ? client.updatedAt : new Date(),
    };
    const result = await db.insert(clients).values(processedClient).returning();
    return result[0];
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const processedData = {
      ...clientData,
      ...(clientData.balance !== undefined && { balance: Number(clientData.balance) }),
      ...(clientData.createdAt && { 
        createdAt: clientData.createdAt instanceof Date ? clientData.createdAt : new Date(clientData.createdAt)
      }),
      ...(clientData.updatedAt && { 
        updatedAt: clientData.updatedAt instanceof Date ? clientData.updatedAt : new Date(clientData.updatedAt)
      }),
    };
    const result = await db
      .update(clients)
      .set(processedData)
      .where(eq(clients.id, id))
      .returning();
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.changes > 0;
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
    const processedProduct = {
      ...product,
      isActive: product.isActive === true || product.isActive === "true", // convert to boolean
    };
    const result = await db.insert(products).values(processedProduct).returning();
    return result[0];
  }

  async updateProduct(id: number, productData: Partial<Product>): Promise<Product | undefined> {
    const processedData = {
      ...productData,
      ...(productData.isActive !== undefined && { 
        isActive: productData.isActive === true || productData.isActive === "true" 
      }),
    };
    const result = await db.update(products).set(processedData).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.changes > 0;
  }
  
  async updateProductStock(id: number, quantity: number): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const currentStock = parseFloat(product.stockQuantity.toString());
    const newStock = currentStock + quantity;
    
    const result = await db.update(products)
      .set({ stockQuantity: newStock })
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
    return result.changes > 0;
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
    // Convert createdAt to a Date if it exists and isn't already one
    const createdAt = invoice.createdAt 
      ? new Date(invoice.createdAt) 
      : new Date();
      
    // Optionally, apply similar conversion to other timestamp fields if any

    const invoiceData = {
      ...invoice,
      createdAt,  // now guaranteed to be a Date
      discount: invoice.discount ?? 0,
      tax: invoice.tax ?? 0,
      paid: invoice.paid ?? 0,
      // Calculate grandTotal if not provided.
      grandTotal: invoice.grandTotal ?? (invoice.total - (invoice.discount ?? 0) + (invoice.tax ?? 0)),
      createdAt: invoice.createdAt ?? Date.now(),
    };

    console.log("DEBUG: invoiceData", invoiceData); // log for debugging
    
    const result = await db.insert(invoices).values(invoiceData).returning();
    const newInvoice = result[0];

    // Update client balance directly using a database query
    if (invoice.clientId) {
      const client = await this.getClient(invoice.clientId);
      if (!client) {
        console.warn(`Client with id ${invoice.clientId} not found`);
      } else {
        const invoiceAmount = parseFloat(invoice.balance.toString());
        let newBalance: number;

        if (invoice.invoiceType === "بيع") {
          newBalance = parseFloat(client.balance.toString()) + invoiceAmount;
        } else {
          newBalance = parseFloat(client.balance.toString()) - invoiceAmount;
        }

        await db
          .update(clients)
          .set({ balance: newBalance })
          .where(eq(clients.id, invoice.clientId));

        console.log(`Client ${invoice.clientId} balance updated to ${newBalance} after invoice creation`);
      }
    }

    return newInvoice;
  }

  async updateInvoice(id: number, invoiceData: Partial<Invoice>): Promise<Invoice | undefined> {
    const oldInvoice = await this.getInvoice(id);
    if (!oldInvoice) return undefined;
    
    const result = await db.update(invoices)
      .set(invoiceData)
      .where(eq(invoices.id, id))
      .returning();
    const updatedInvoice = result[0];

    // Update client balance directly using a database query
    if (invoiceData.clientId) {
      const client = await this.getClient(invoiceData.clientId);
      if (!client) {
        console.warn(`Client with id ${invoiceData.clientId} not found`);
      } else {
        const oldInvoice = await this.getInvoice(id);
        if (!oldInvoice) {
          console.warn(`Old invoice with id ${id} not found`);
        } else {
          let newBalance: number;
          const oldInvoiceAmount = parseFloat(oldInvoice.balance.toString());
          const newInvoiceAmount = parseFloat(invoiceData.balance?.toString() || oldInvoice.balance.toString());

          if (oldInvoice.invoiceType === "بيع") {
            newBalance = parseFloat(client.balance.toString()) - oldInvoiceAmount + newInvoiceAmount;
          } else {
            newBalance = parseFloat(client.balance.toString()) + oldInvoiceAmount - newInvoiceAmount;
          }

          await db
            .update(clients)
            .set({ balance: newBalance })
            .where(eq(clients.id, invoiceData.clientId));

          console.log(`Client ${invoiceData.clientId} balance updated to ${newBalance} after invoice update`);
        }
      }
    }

    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    // Get invoice before deletion
    const invoice = await this.getInvoice(id);
    if (!invoice) return false;
    
    // Update client balance directly using a database query
    if (invoice.clientId) {
      const client = await this.getClient(invoice.clientId);
      if (!client) {
        console.warn(`Client with id ${invoice.clientId} not found`);
      } else {
        let newBalance: number;
        const invoiceAmount = parseFloat(invoice.balance.toString());

        if (invoice.invoiceType === "بيع") {
          newBalance = parseFloat(client.balance.toString()) - invoiceAmount;
        } else {
          newBalance = parseFloat(client.balance.toString()) + invoiceAmount;
        }

        await db
          .update(clients)
          .set({ balance: newBalance })
          .where(eq(clients.id, invoice.clientId));

        console.log(`Client ${invoice.clientId} balance updated to ${newBalance} after invoice deletion`);
      }
    }
    
    // First delete related invoice items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    // Then delete the invoice
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.changes > 0;
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
  
  async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const result = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return result[0];
  }

  async createInvoiceItem(invoiceItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(invoiceItem).returning();
    
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
    
    return result[0];
  }

  async updateInvoiceItem(id: number, invoiceItemData: Partial<InvoiceItem>): Promise<InvoiceItem | undefined> {
    const oldInvoiceItem = await this.getInvoiceItem(id);
    if (!oldInvoiceItem) return undefined;
    
    // Handle stock changes if quantity changed
    if (invoiceItemData.quantity && invoiceItemData.quantity !== oldInvoiceItem.quantity) {
      const product = await this.getProduct(oldInvoiceItem.productId);
      const invoice = await this.getInvoice(oldInvoiceItem.invoiceId);
      
      if (product && invoice) {
        const oldQuantity = parseFloat(oldInvoiceItem.quantity.toString());
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
    
    const result = await db.update(invoiceItems)
      .set(invoiceItemData)
      .where(eq(invoiceItems.id, id))
      .returning();
    
    return result[0];
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    // Get invoice item before deletion
    const invoiceItem = await this.getInvoiceItem(id);
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
    
    const result = await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return result.changes > 0;
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
    // Ensure createdAt is a Date and amount is numeric.
    const processedTransaction = {
      ...transaction,
      createdAt:
        transaction.createdAt instanceof Date
          ? transaction.createdAt
          : new Date(transaction.createdAt || Date.now()),
      amount: Number(transaction.amount),
    };
    const result = await db.insert(transactions).values(processedTransaction).returning();
    
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
    
    return result[0];
  }

  async updateTransaction(id: number, transactionData: Partial<Transaction>): Promise<Transaction | undefined> {
    const oldTransaction = await this.getTransaction(id);
    if (!oldTransaction) return undefined;
    
    const processedData = {
      ...transactionData,
      ...(transactionData.createdAt && {
        createdAt:
          transactionData.createdAt instanceof Date
            ? transactionData.createdAt
            : new Date(transactionData.createdAt)
      }),
      ...(transactionData.amount !== undefined && { amount: Number(transactionData.amount) }),
    };
    const result = await db.update(transactions)
      .set(processedData)
      .where(eq(transactions.id, id))
      .returning();
    
    // If the amount or transaction type has changed, update client balance
    if (transactionData.amount || 
        (transactionData.transactionType && transactionData.transactionType !== oldTransaction.transactionType)) {
      
      const client = await this.getClient(oldTransaction.clientId);
      if (client) {
        const balance = parseFloat(client.balance.toString());
        let newBalance = balance;
        
        // Reverse old transaction effect
        if (oldTransaction.transactionType === "قبض") {
          newBalance += parseFloat(oldTransaction.amount.toString());
        } else if (oldTransaction.transactionType === "صرف") {
          newBalance -= parseFloat(oldTransaction.amount.toString());
        }
        
        // Apply new transaction effect
        const updatedTransaction = result[0];
        if (updatedTransaction.transactionType === "قبض") {
          newBalance -= parseFloat(updatedTransaction.amount.toString());
        } else if (updatedTransaction.transactionType === "صرف") {
          newBalance += parseFloat(updatedTransaction.amount.toString());
        }
        
        await this.updateClient(client.id, { balance: newBalance.toString() });
      }
    }
    
    return result[0];
  }

  async deleteTransaction(id: number): Promise<boolean> {
    // Get transaction before deletion
    const transaction = await this.getTransaction(id);
    if (!transaction) return false;
    
    // Update client balance before deletion
    const client = await this.getClient(transaction.clientId);
    if (client) {
      const amount = parseFloat(transaction.amount.toString());
      const balance = parseFloat(client.balance.toString());
      
      let newBalance = balance;
      // Reverse transaction effect
      if (transaction.transactionType === "قبض") {
        newBalance += amount;
      } else if (transaction.transactionType === "صرف") {
        newBalance -= amount;
      }
      
      await this.updateClient(client.id, { balance: newBalance.toString() });
    }
    
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.changes > 0;
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