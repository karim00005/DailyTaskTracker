import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  isActive: true,
});

// Clients table
export const clients = sqliteTable("clients", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  client_type: text("client_type").default("عميل"),
  account_type: text("account_type").notNull().default("مدين"),
  code: text("code"),
  tax_id: text("tax_id"),
  balance: real("balance").notNull().default(0),
  address: text("address"),
  city: text("city"),
  phone: text("phone"),
  mobile: text("mobile"),
  email: text("email"),
  notes: text("notes"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const insertClientSchema = z.object({
  name: z.string().min(1),
  client_type: z.string().default("عميل"),
  account_type: z.string().default("مدين"),
  code: z.string().optional(),
  tax_id: z.string().optional(),
  balance: z.number().default(0),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true)
});

// Projects table
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  status: text("status"),
  budget: integer("budget"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Tasks table
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  startDate: integer("start_date", { mode: "timestamp" }),
  dueDate: integer("due_date", { mode: "timestamp" }),
  status: text("status"),
  priority: text("priority"),
  assignee: text("assignee"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Timesheet table
export const timesheets = sqliteTable("timesheets", {
  id: integer("id").primaryKey(),
  taskId: integer("task_id")
    .notNull()
    .references(() => tasks.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  duration: integer("duration").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// Products table
export const products = sqliteTable("products", {
  id: integer("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  unit_of_measure: text("unit_of_measure").notNull(),
  category: text("category"),
  cost_price: real("cost_price").notNull(),
  sell_price_1: real("sell_price_1").notNull(),
  sell_price_2: real("sell_price_2"),
  sell_price_3: real("sell_price_3"),
  stock_quantity: real("stock_quantity").notNull().default(0),
  reorder_level: real("reorder_level"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp" }).defaultNow(),
});

export const insertProductSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  unit_of_measure: z.string().min(1),
  category: z.string().optional(),
  cost_price: z.number().positive(),
  sell_price_1: z.number().positive(),
  sell_price_2: z.number().optional(),
  sell_price_3: z.number().optional(),
  stock_quantity: z.number().default(0),
  reorder_level: z.number().optional(),
  is_active: z.boolean().default(true)
});

// Warehouses table
export const warehouses = sqliteTable("warehouses", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const insertWarehouseSchema = createInsertSchema(warehouses).pick({
  name: true,
  address: true,
  isDefault: true,
  isActive: true,
});



// Invoices table
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceType: text("invoice_type").notNull(), // بيع, شراء, مرتجع بيع, مرتجع شراء
  clientId: integer("client_id").notNull(),
  warehouseId: integer("warehouse_id"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  paymentMethod: text("payment_method").notNull(),
  userId: integer("user_id").notNull(),
  total: real("total").notNull(),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  grandTotal: real("grand_total").notNull(),
  paid: real("paid").notNull().default(0),
  balance: real("balance").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
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
export const invoiceItems = sqliteTable("invoice_items", {
  id: integer("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull(),
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
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey(),
  transactionNumber: text("transaction_number").notNull(),
  transactionType: text("transaction_type").notNull(), // قبض, صرف
  clientId: integer("client_id").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  amount: real("amount").notNull(),
  paymentMethod: text("payment_method").notNull(),
  reference: text("reference"),
  bank: text("bank"),
  notes: text("notes"),
  userId: integer("user_id").notNull(),
  createdAt: integer("created_at").notNull(),
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
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
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

export const projectRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  tasks: many(tasks),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
}));

export const timesheetRelations = relations(timesheets, ({ one }) => ({
  task: one(tasks, {
    fields: [timesheets.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [timesheets.userId],
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
