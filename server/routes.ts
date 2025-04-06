import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema,
  insertClientSchema,
  insertProductSchema,
  insertWarehouseSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertTransactionSchema,
  insertSettingsSchema
} from "@shared/schema";
import { createBackup, restoreBackup } from "./backup";
import { importExcelData } from "./import";
import { exportExcelData } from "./export";
import { NextFunction } from "express";

// Helper function to handle validation
function validate<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  try {
    return schema.parse(data);
  } catch (error) {
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "اسم المستخدم وكلمة المرور مطلوبين" });
    }

    const user = await storage.getUserByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "هذا الحساب غير نشط" });
    }

    const userInfo = { ...user };
    delete userInfo.password; // Don't send password back

    // In a real app, generate and send a token here
    return res.json({ user: userInfo });
  });

  // User routes
  app.get("/api/users", async (req: Request, res: Response) => {
    const users = await storage.getUsers();
    return res.json(users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }));
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "معرف المستخدم غير صالح" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    const userData = validate(insertUserSchema, req.body);
    if (!userData) {
      return res.status(400).json({ message: "بيانات المستخدم غير صالحة" });
    }

    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      return res.status(409).json({ message: "اسم المستخدم موجود بالفعل" });
    }

    const newUser = await storage.createUser(userData);
    const { password, ...userWithoutPassword } = newUser;
    return res.status(201).json(userWithoutPassword);
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "معرف المستخدم غير صالح" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    // Only validate fields that are provided
    const userData = req.body;
    if (userData.username && userData.username !== user.username) {
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: "اسم المستخدم موجود بالفعل" });
      }
    }

    const updatedUser = await storage.updateUser(userId, userData);
    if (!updatedUser) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث المستخدم" });
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return res.json(userWithoutPassword);
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "معرف المستخدم غير صالح" });
    }

    const success = await storage.deleteUser(userId);
    if (!success) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    return res.status(204).end();
  });

  // Client routes
  app.get("/api/clients", async (req: Request, res: Response) => {
    const clients = await storage.getClients();
    return res.json(clients);
  });

  app.get("/api/clients/:id", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "معرف العميل غير صالح" });
    }

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "العميل غير موجود" });
    }

    return res.json(client);
  });

  app.post("/api/clients", async (req: Request, res: Response) => {
    const clientData = validate(insertClientSchema, req.body);
    if (!clientData) {
      return res.status(400).json({ message: "بيانات العميل غير صالحة" });
    }

    const newClient = await storage.createClient(clientData);
    return res.status(201).json(newClient);
  });

  app.put("/api/clients/:id", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "معرف العميل غير صالح" });
    }

    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: "العميل غير موجود" });
    }

    const updatedClient = await storage.updateClient(clientId, req.body);
    if (!updatedClient) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث العميل" });
    }

    return res.json(updatedClient);
  });

  app.delete("/api/clients/:id", async (req: Request, res: Response) => {
    const clientId = parseInt(req.params.id);
    if (isNaN(clientId)) {
      return res.status(400).json({ message: "معرف العميل غير صالح" });
    }

    const success = await storage.deleteClient(clientId);
    if (!success) {
      return res.status(404).json({ message: "العميل غير موجود" });
    }

    return res.status(204).end();
  });

  // Product routes
  app.get("/api/products", async (req: Request, res: Response) => {
    const products = await storage.getProducts();
    return res.json(products);
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "معرف المنتج غير صالح" });
    }

    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    return res.json(product);
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    const productData = validate(insertProductSchema, req.body);
    if (!productData) {
      return res.status(400).json({ message: "بيانات المنتج غير صالحة" });
    }

    const newProduct = await storage.createProduct(productData);
    return res.status(201).json(newProduct);
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "معرف المنتج غير صالح" });
    }

    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    const updatedProduct = await storage.updateProduct(productId, req.body);
    if (!updatedProduct) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث المنتج" });
    }

    return res.json(updatedProduct);
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ message: "معرف المنتج غير صالح" });
    }

    const success = await storage.deleteProduct(productId);
    if (!success) {
      return res.status(404).json({ message: "المنتج غير موجود" });
    }

    return res.status(204).end();
  });

  // Warehouse routes
  app.get("/api/warehouses", async (req: Request, res: Response) => {
    const warehouses = await storage.getWarehouses();
    return res.json(warehouses);
  });

  app.get("/api/warehouses/default", async (req: Request, res: Response) => {
    const warehouse = await storage.getDefaultWarehouse();
    if (!warehouse) {
      return res.status(404).json({ message: "المخزن الافتراضي غير موجود" });
    }

    return res.json(warehouse);
  });

  app.get("/api/warehouses/:id", async (req: Request, res: Response) => {
    const warehouseId = parseInt(req.params.id);
    if (isNaN(warehouseId)) {
      return res.status(400).json({ message: "معرف المخزن غير صالح" });
    }

    const warehouse = await storage.getWarehouse(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "المخزن غير موجود" });
    }

    return res.json(warehouse);
  });

  app.post("/api/warehouses", async (req: Request, res: Response) => {
    const warehouseData = validate(insertWarehouseSchema, req.body);
    if (!warehouseData) {
      return res.status(400).json({ message: "بيانات المخزن غير صالحة" });
    }

    const newWarehouse = await storage.createWarehouse(warehouseData);
    return res.status(201).json(newWarehouse);
  });

  app.put("/api/warehouses/:id", async (req: Request, res: Response) => {
    const warehouseId = parseInt(req.params.id);
    if (isNaN(warehouseId)) {
      return res.status(400).json({ message: "معرف المخزن غير صالح" });
    }

    const warehouse = await storage.getWarehouse(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "المخزن غير موجود" });
    }

    const updatedWarehouse = await storage.updateWarehouse(warehouseId, req.body);
    if (!updatedWarehouse) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث المخزن" });
    }

    return res.json(updatedWarehouse);
  });

  app.delete("/api/warehouses/:id", async (req: Request, res: Response) => {
    const warehouseId = parseInt(req.params.id);
    if (isNaN(warehouseId)) {
      return res.status(400).json({ message: "معرف المخزن غير صالح" });
    }

    const success = await storage.deleteWarehouse(warehouseId);
    if (!success) {
      return res.status(404).json({ message: "فشل حذف المخزن - قد يكون هذا هو المخزن الافتراضي" });
    }

    return res.status(204).end();
  });

  // Invoice routes
  app.get("/api/invoices", async (req: Request, res: Response) => {
    const { type, clientId } = req.query;
    
    let invoices;
    if (type) {
      invoices = await storage.getInvoicesByType(type as string);
    } else if (clientId) {
      const cId = parseInt(clientId as string);
      if (isNaN(cId)) {
        return res.status(400).json({ message: "معرف العميل غير صالح" });
      }
      invoices = await storage.getInvoicesByClient(cId);
    } else {
      invoices = await storage.getInvoices();
    }
    
    return res.json(invoices);
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "معرف الفاتورة غير صالح" });
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    return res.json(invoice);
  });

  app.get("/api/invoices/:id/items", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "معرف الفاتورة غير صالح" });
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    const invoiceItems = await storage.getInvoiceItems(invoiceId);
    return res.json(invoiceItems);
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    const invoiceData = validate(insertInvoiceSchema, req.body);
    if (!invoiceData) {
      return res.status(400).json({ message: "بيانات الفاتورة غير صالحة" });
    }

    const newInvoice = await storage.createInvoice(invoiceData);
    return res.status(201).json(newInvoice);
  });

  app.post("/api/invoices/:id/items", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "معرف الفاتورة غير صالح" });
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    const invoiceItemData = validate(insertInvoiceItemSchema, { ...req.body, invoiceId });
    if (!invoiceItemData) {
      return res.status(400).json({ message: "بيانات عنصر الفاتورة غير صالحة" });
    }

    const newInvoiceItem = await storage.createInvoiceItem(invoiceItemData);
    return res.status(201).json(newInvoiceItem);
  });

  app.put("/api/invoices/:id", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "معرف الفاتورة غير صالح" });
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
    if (!updatedInvoice) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث الفاتورة" });
    }

    return res.json(updatedInvoice);
  });

  app.put("/api/invoices/:invoiceId/items/:itemId", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.invoiceId);
    const itemId = parseInt(req.params.itemId);
    
    if (isNaN(invoiceId) || isNaN(itemId)) {
      return res.status(400).json({ message: "معرف الفاتورة أو العنصر غير صالح" });
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    const invoiceItems = await storage.getInvoiceItems(invoiceId);
    const item = invoiceItems.find(i => i.id === itemId);
    
    if (!item) {
      return res.status(404).json({ message: "عنصر الفاتورة غير موجود" });
    }

    const updatedItem = await storage.updateInvoiceItem(itemId, req.body);
    if (!updatedItem) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث عنصر الفاتورة" });
    }

    return res.json(updatedItem);
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "معرف الفاتورة غير صالح" });
    }

    const success = await storage.deleteInvoice(invoiceId);
    if (!success) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    return res.status(204).end();
  });

  app.delete("/api/invoices/:invoiceId/items/:itemId", async (req: Request, res: Response) => {
    const invoiceId = parseInt(req.params.invoiceId);
    const itemId = parseInt(req.params.itemId);
    
    if (isNaN(invoiceId) || isNaN(itemId)) {
      return res.status(400).json({ message: "معرف الفاتورة أو العنصر غير صالح" });
    }

    const invoice = await storage.getInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "الفاتورة غير موجودة" });
    }

    const success = await storage.deleteInvoiceItem(itemId);
    if (!success) {
      return res.status(404).json({ message: "عنصر الفاتورة غير موجود" });
    }

    return res.status(204).end();
  });

  // Transaction routes
  app.get("/api/transactions", async (req: Request, res: Response) => {
    const { type, clientId } = req.query;
    
    let transactions;
    if (type) {
      transactions = await storage.getTransactionsByType(type as string);
    } else if (clientId) {
      const cId = parseInt(clientId as string);
      if (isNaN(cId)) {
        return res.status(400).json({ message: "معرف العميل غير صالح" });
      }
      transactions = await storage.getTransactionsByClient(cId);
    } else {
      transactions = await storage.getTransactions();
    }
    
    return res.json(transactions);
  });

  app.get("/api/transactions/:id", async (req: Request, res: Response) => {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "معرف المعاملة غير صالح" });
    }

    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "المعاملة غير موجودة" });
    }

    return res.json(transaction);
  });

  app.post("/api/transactions", async (req: Request, res: Response) => {
    const transactionData = validate(insertTransactionSchema, req.body);
    if (!transactionData) {
      return res.status(400).json({ message: "بيانات المعاملة غير صالحة" });
    }

    const newTransaction = await storage.createTransaction(transactionData);
    return res.status(201).json(newTransaction);
  });

  app.put("/api/transactions/:id", async (req: Request, res: Response) => {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "معرف المعاملة غير صالح" });
    }

    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "المعاملة غير موجودة" });
    }

    const updatedTransaction = await storage.updateTransaction(transactionId, req.body);
    if (!updatedTransaction) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث المعاملة" });
    }

    return res.json(updatedTransaction);
  });

  app.delete("/api/transactions/:id", async (req: Request, res: Response) => {
    const transactionId = parseInt(req.params.id);
    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "معرف المعاملة غير صالح" });
    }

    const success = await storage.deleteTransaction(transactionId);
    if (!success) {
      return res.status(404).json({ message: "المعاملة غير موجودة" });
    }

    return res.status(204).end();
  });

  // Settings routes
  app.get("/api/settings", async (req: Request, res: Response) => {
    const settings = await storage.getSettings();
    if (!settings) {
      return res.status(404).json({ message: "الإعدادات غير موجودة" });
    }

    return res.json(settings);
  });

  app.put("/api/settings", async (req: Request, res: Response) => {
    const settingsData = req.body;
    if (Object.keys(settingsData).length === 0) {
      return res.status(400).json({ message: "لا توجد بيانات للتحديث" });
    }

    const updatedSettings = await storage.updateSettings(settingsData);
    if (!updatedSettings) {
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث الإعدادات" });
    }

    return res.json(updatedSettings);
  });

  // Backup and Restore routes
  app.get("/api/backup/create", createBackup);
  app.post("/api/backup/restore", restoreBackup);
  
  // Excel export and import routes
  app.get("/api/export/excel", exportExcelData);
  app.post("/api/import/excel", importExcelData);
  
  // Batch Operations routes
  // Clients batch operations
  app.post("/api/batch/clients/create", async (req: Request, res: Response) => {
    try {
      const clientsData = req.body;
      if (!Array.isArray(clientsData) || clientsData.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من بيانات العملاء" });
      }
      
      const createdClients = [];
      for (const clientData of clientsData) {
        const validData = validate(insertClientSchema, clientData);
        if (validData) {
          const client = await storage.createClient(validData);
          createdClients.push(client);
        }
      }
      
      return res.status(201).json({ 
        count: createdClients.length,
        clients: createdClients
      });
    } catch (error) {
      console.error("Error in batch client creation:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء إنشاء العملاء" });
    }
  });
  
  app.post("/api/batch/clients/update", async (req: Request, res: Response) => {
    try {
      const clientsData = req.body;
      if (!Array.isArray(clientsData) || clientsData.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من بيانات العملاء" });
      }
      
      const updatedClients = [];
      for (const clientData of clientsData) {
        if (!clientData.id) {
          continue;
        }
        
        const clientId = parseInt(clientData.id.toString());
        const client = await storage.getClient(clientId);
        if (client) {
          const updatedClient = await storage.updateClient(clientId, clientData);
          if (updatedClient) {
            updatedClients.push(updatedClient);
          }
        }
      }
      
      return res.json({ 
        count: updatedClients.length,
        clients: updatedClients
      });
    } catch (error) {
      console.error("Error in batch client update:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث العملاء" });
    }
  });
  
  app.post("/api/batch/clients/delete", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من معرفات العملاء" });
      }
      
      const results = [];
      for (const id of ids) {
        const clientId = parseInt(id.toString());
        const success = await storage.deleteClient(clientId);
        results.push({ id, success });
      }
      
      const successCount = results.filter(r => r.success).length;
      return res.json({ 
        count: successCount,
        results
      });
    } catch (error) {
      console.error("Error in batch client deletion:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء حذف العملاء" });
    }
  });
  
  app.post("/api/batch/clients/recode", async (req: Request, res: Response) => {
    try {
      const { fieldId, newValue, ids } = req.body;
      if (!fieldId || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }
      
      const results = [];
      for (const id of ids) {
        const clientId = parseInt(id.toString());
        const client = await storage.getClient(clientId);
        
        if (client) {
          const update = { [fieldId]: newValue };
          const updatedClient = await storage.updateClient(clientId, update);
          results.push({ 
            id: clientId, 
            success: !!updatedClient,
            oldValue: client[fieldId as keyof typeof client],
            newValue
          });
        } else {
          results.push({ id: clientId, success: false });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      return res.json({ 
        count: successCount,
        results
      });
    } catch (error) {
      console.error("Error in batch client field update:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث بيانات العملاء" });
    }
  });
  
  // Products batch operations
  app.post("/api/batch/products/create", async (req: Request, res: Response) => {
    try {
      const productsData = req.body;
      if (!Array.isArray(productsData) || productsData.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من بيانات المنتجات" });
      }
      
      const createdProducts = [];
      for (const productData of productsData) {
        const validData = validate(insertProductSchema, productData);
        if (validData) {
          const product = await storage.createProduct(validData);
          createdProducts.push(product);
        }
      }
      
      return res.status(201).json({ 
        count: createdProducts.length,
        products: createdProducts
      });
    } catch (error) {
      console.error("Error in batch product creation:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء إنشاء المنتجات" });
    }
  });
  
  app.post("/api/batch/products/update", async (req: Request, res: Response) => {
    try {
      const productsData = req.body;
      if (!Array.isArray(productsData) || productsData.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من بيانات المنتجات" });
      }
      
      const updatedProducts = [];
      for (const productData of productsData) {
        if (!productData.id) {
          continue;
        }
        
        const productId = parseInt(productData.id.toString());
        const product = await storage.getProduct(productId);
        if (product) {
          const updatedProduct = await storage.updateProduct(productId, productData);
          if (updatedProduct) {
            updatedProducts.push(updatedProduct);
          }
        }
      }
      
      return res.json({ 
        count: updatedProducts.length,
        products: updatedProducts
      });
    } catch (error) {
      console.error("Error in batch product update:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث المنتجات" });
    }
  });
  
  app.post("/api/batch/products/delete", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من معرفات المنتجات" });
      }
      
      const results = [];
      for (const id of ids) {
        const productId = parseInt(id.toString());
        const success = await storage.deleteProduct(productId);
        results.push({ id, success });
      }
      
      const successCount = results.filter(r => r.success).length;
      return res.json({ 
        count: successCount,
        results
      });
    } catch (error) {
      console.error("Error in batch product deletion:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء حذف المنتجات" });
    }
  });
  
  app.post("/api/batch/products/recode", async (req: Request, res: Response) => {
    try {
      const { fieldId, newValue, ids } = req.body;
      if (!fieldId || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }
      
      const results = [];
      for (const id of ids) {
        const productId = parseInt(id.toString());
        const product = await storage.getProduct(productId);
        
        if (product) {
          const update = { [fieldId]: newValue };
          const updatedProduct = await storage.updateProduct(productId, update);
          results.push({ 
            id: productId, 
            success: !!updatedProduct,
            oldValue: product[fieldId as keyof typeof product],
            newValue
          });
        } else {
          results.push({ id: productId, success: false });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      return res.json({ 
        count: successCount,
        results
      });
    } catch (error) {
      console.error("Error in batch product field update:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث بيانات المنتجات" });
    }
  });
  
  // Invoices batch operations
  app.post("/api/batch/invoices/create", async (req: Request, res: Response) => {
    try {
      const invoicesData = req.body;
      if (!Array.isArray(invoicesData) || invoicesData.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من بيانات الفواتير" });
      }
      
      const createdInvoices = [];
      for (const invoiceData of invoicesData) {
        const validData = validate(insertInvoiceSchema, invoiceData);
        if (validData) {
          const invoice = await storage.createInvoice(validData);
          createdInvoices.push(invoice);
        }
      }
      
      return res.status(201).json({ 
        count: createdInvoices.length,
        invoices: createdInvoices
      });
    } catch (error) {
      console.error("Error in batch invoice creation:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء إنشاء الفواتير" });
    }
  });
  
  app.post("/api/batch/invoices/update", async (req: Request, res: Response) => {
    try {
      const invoicesData = req.body;
      if (!Array.isArray(invoicesData) || invoicesData.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من بيانات الفواتير" });
      }
      
      const updatedInvoices = [];
      for (const invoiceData of invoicesData) {
        if (!invoiceData.id) {
          continue;
        }
        
        const invoiceId = parseInt(invoiceData.id.toString());
        const invoice = await storage.getInvoice(invoiceId);
        if (invoice) {
          const updatedInvoice = await storage.updateInvoice(invoiceId, invoiceData);
          if (updatedInvoice) {
            updatedInvoices.push(updatedInvoice);
          }
        }
      }
      
      return res.json({ 
        count: updatedInvoices.length,
        invoices: updatedInvoices
      });
    } catch (error) {
      console.error("Error in batch invoice update:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث الفواتير" });
    }
  });
  
  app.post("/api/batch/invoices/delete", async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "يجب توفير مصفوفة من معرفات الفواتير" });
      }
      
      const results = [];
      for (const id of ids) {
        const invoiceId = parseInt(id.toString());
        const success = await storage.deleteInvoice(invoiceId);
        results.push({ id, success });
      }
      
      const successCount = results.filter(r => r.success).length;
      return res.json({ 
        count: successCount,
        results
      });
    } catch (error) {
      console.error("Error in batch invoice deletion:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء حذف الفواتير" });
    }
  });
  
  app.post("/api/batch/invoices/recode", async (req: Request, res: Response) => {
    try {
      const { fieldId, newValue, ids } = req.body;
      if (!fieldId || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "بيانات غير صالحة" });
      }
      
      const results = [];
      for (const id of ids) {
        const invoiceId = parseInt(id.toString());
        const invoice = await storage.getInvoice(invoiceId);
        
        if (invoice) {
          const update = { [fieldId]: newValue };
          const updatedInvoice = await storage.updateInvoice(invoiceId, update);
          results.push({ 
            id: invoiceId, 
            success: !!updatedInvoice,
            oldValue: invoice[fieldId as keyof typeof invoice],
            newValue
          });
        } else {
          results.push({ id: invoiceId, success: false });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      return res.json({ 
        count: successCount,
        results
      });
    } catch (error) {
      console.error("Error in batch invoice field update:", error);
      return res.status(500).json({ message: "حدث خطأ أثناء تحديث بيانات الفواتير" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
