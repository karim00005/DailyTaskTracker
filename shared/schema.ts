import { pgTable, text, serial, integer, boolean, date, time, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  isActive: true,
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // عميل, مورد, موظف, أخرى
  accountType: text("account_type").notNull(), // دائن, مدين
  code: text("code"),
  taxId: text("tax_id"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  type: true,
  accountType: true,
  code: true,
  taxId: true,
  balance: true,
  address: true,
  city: true,
  phone: true,
  mobile: true,
  email: true,
  notes: true,
  isActive: true,
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  unitOfMeasure: text("unit_of_measure").notNull(),
  category: text("category"),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
  sellPrice1: decimal("sell_price_1", { precision: 10, scale: 2 }).notNull(),
  sellPrice2: decimal("sell_price_2", { precision: 10, scale: 2 }),
  sellPrice3: decimal("sell_price_3", { precision: 10, scale: 2 }),
  stockQuantity: decimal("stock_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  reorderLevel: decimal("reorder_level", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertProductSchema = createInsertSchema(products).pick({
  code: true,
  name: true,
  description: true,
  unitOfMeasure: true,
  category: true,
  costPrice: true,
  sellPrice1: true,
  sellPrice2: true,
  sellPrice3: true,
  stockQuantity: true,
  reorderLevel: true,
  isActive: true,
});

// Warehouses table
export const warehouses = pgTable("warehouses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertWarehouseSchema = createInsertSchema(warehouses).pick({
  name: true,
  address: true,
  isDefault: true,
  isActive: true,
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceType: text("invoice_type").notNull(), // بيع, شراء, مرتجع بيع, مرتجع شراء
  clientId: integer("client_id").notNull(),
  warehouseId: integer("warehouse_id"),
  date: date("date").notNull(),
  time: time("time").notNull(),
  paymentMethod: text("payment_method").notNull(),
  userId: integer("user_id").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull(),
  paid: decimal("paid", { precision: 10, scale: 2 }).notNull().default("0"),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  invoiceType: true,
  clientId: true,
  warehouseId: true,
  date: true,
  time: true,
  paymentMethod: true,
  userId: true,
  total: true,
  discount: true,
  tax: true,
  grandTotal: true,
  paid: true,
  balance: true,
  notes: true,
});

// Invoice Items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).pick({
  invoiceId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  tax: true,
  total: true,
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionNumber: text("transaction_number").notNull(),
  transactionType: text("transaction_type").notNull(), // قبض, صرف
  clientId: integer("client_id").notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  reference: text("reference"),
  bank: text("bank"),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  transactionNumber: true,
  transactionType: true,
  clientId: true,
  date: true,
  time: true,
  amount: true,
  paymentMethod: true,
  reference: true,
  bank: true,
  notes: true,
  userId: true,
});

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  website: text("website"),
  taxNumber: text("tax_number"),
  currency: text("currency").notNull().default("جنيه مصري"),
  currencySymbol: text("currency_symbol").notNull().default("ج.م"),
  decimalPlaces: integer("decimal_places").notNull().default(2),
  backupPath: text("backup_path"),
  cloudBackupPath: text("cloud_backup_path"),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  companyName: true,
  address: true,
  phone: true,
  mobile: true,
  email: true,
  website: true,
  taxNumber: true,
  currency: true,
  currencySymbol: true,
  decimalPlaces: true,
  backupPath: true,
  cloudBackupPath: true,
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
  transactions: many(transactions),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(invoices),
  transactions: many(transactions),
}));

export const productsRelations = relations(products, ({ many }) => ({
  invoiceItems: many(invoiceItems),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  warehouse: one(warehouses, {
    fields: [invoices.warehouseId],
    references: [warehouses.id],
  }),
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  client: one(clients, {
    fields: [transactions.clientId],
    references: [clients.id],
  }),
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
