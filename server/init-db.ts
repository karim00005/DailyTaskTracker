import { db } from './db';
import { users, clients, products, warehouses, settings } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Checks if a table exists in the database
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.get<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${tableName}`
    );
    return !!result;
  } catch (error) {
    console.error(`Error checking for table ${tableName}:`, error);
    return false;
  }
}

/**
 * Checks if a column exists in a table
 */
async function columnExists(table: string, column: string): Promise<boolean> {
  try {
    const result = await db.get<{ cid: number }>(
      sql`SELECT cid FROM pragma_table_info(${table}) WHERE name=${column}`
    );
    return !!result;
  } catch (error) {
    console.error(`Error checking for column ${column} in ${table}:`, error);
    return false;
  }
}

/**
 * Ensures all required database schema exists
 */
async function ensureDatabaseSchema() {
  const requiredTables = [
    { name: 'users', columns: [] },
    { name: 'warehouses', columns: [] },
    { name: 'settings', columns: [] },
    { name: 'clients', columns: [{ name: 'balance', type: 'REAL DEFAULT 0' }] },
    { name: 'products', columns: [] }
  ];

  // Verify all tables exist
  for (const table of requiredTables) {
    if (!await tableExists(table.name)) {
      throw new Error(`Required table ${table.name} does not exist. Run migrations first.`);
    }

    // Verify all columns exist
    for (const column of table.columns) {
      if (!await columnExists(table.name, column.name)) {
        console.log(`Adding missing column '${column.name}' to ${table.name} table...`);
        await db.run(sql`
          ALTER TABLE ${sql.raw(table.name)} ADD COLUMN ${sql.raw(column.name)} ${sql.raw(column.type)}
        `);
      }
    }
  }
}

/**
 * Initializes the database with default data
 */
export const initializeDatabase = async () => {
  console.log("Initializing database with default data...");
  
  try {
    // 1. Verify database schema
    await ensureDatabaseSchema();
    
    // 2. Initialize default users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      console.log("Creating default admin user...");
      await db.insert(users).values({
        username: "admin",
        password: "admin123", // In production, use hashed passwords!
        fullName: "كريم كمال",
        role: "admin",
        isActive: true
      });
    }

    // 3. Initialize default warehouses
    const existingWarehouses = await db.select().from(warehouses);
    if (existingWarehouses.length === 0) {
      console.log("Creating default warehouse...");
      await db.insert(warehouses).values({
        name: "المخزن الرئيسي",
        address: "المقر الرئيسي",
        isDefault: true,
        isActive: true
      });
    }

    // 4. Initialize default settings
    const existingSettings = await db.select().from(settings);
    if (existingSettings.length === 0) {
      console.log("Creating default settings...");
      await db.insert(settings).values({
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
      });
    }

    // 5. Initialize sample clients
    const existingClients = await db.select().from(clients);
    if (existingClients.length === 0) {
      console.log("Creating sample clients...");
      await db.insert(clients).values({
        name: "محمد عبدالله حسين عبدالعظيم",
        accountType: "مدين",
        balance: 0,
        createdAt: Math.floor(Date.now() / 1000)
      });

      await db.insert(clients).values({
        name: "جلال البيه",
        accountType: "مدين",
        balance: 0,
        createdAt: Math.floor(Date.now() / 1000)
      });
    }

    // 6. Initialize sample products
    const existingProducts = await db.select().from(products);
    if (existingProducts.length === 0) {
      console.log("Creating sample products...");
      await db.insert(products).values({
        name: "شركة الدلتا للسكر",
        code: "P001",
        description: "سكر أبيض",
        unitOfMeasure: "كج",
        category: "مواد غذائية",
        costPrice: 25000,
        sellPrice1: 29200,
        sellPrice2: 28000,
        sellPrice3: 27000,
        stockQuantity: 500,
        reorderLevel: 50,
        isActive: true
      });
    }

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};