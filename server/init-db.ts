import { db } from './db';
import { 
  users, clients, products, warehouses, settings
} from '@shared/schema';

const checkClientsSchema = async () => {
  try {
    await db.select().from(clients).where(eq(clients.balance, 0));
    console.log("The 'balance' column exists in the clients table.");
    return true;
  } catch (error) {
    console.log("The 'balance' column does NOT exist in the clients table.");
    return false;
  }
};

export async function initializeDatabase() {
  console.log("Initializing database with default data...");
  
  try {
    // Check the clients table schema
    const hasBalance = await checkClientsSchema();
    if (!hasBalance) {
      throw new Error("Database schema is not properly initialized");
    }
    
    // Check if we have any users
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log("Creating default admin user...");
      await db.insert(users).values({
        username: "admin",
        password: "admin123",
        fullName: "كريم كمال",
        role: "admin",
        isActive: true
      });
    }

    // Check if we have any warehouses
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

    // Check if we have any settings
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

    // Check if we have any clients
    const existingClients = await db.select().from(clients);
    
    if (existingClients.length === 0) {
      console.log("Creating sample clients...");
      await db.insert(clients).values({
        name: "محمد عبدالله حسين عبدالعظيم",
        accountType: "مدين",
        balance: 0,
        address: "88 شارع صدقي",
        city: "طنطا",
        phone: null,
        mobile: "01099998017",
        email: null,
        notes: null,
        isActive: true,
        createdAt: Date.now()
      });

      await db.insert(clients).values({
        name: "جلال البيه",
        accountType: "مدين",
        balance: 0,
        address: "المعادي",
        city: "القاهرة",
        phone: null,
        mobile: "01234567890",
        email: null,
        notes: null,
        isActive: true,
        createdAt: Date.now()
      });

    }

    // Check if we have any products
    const existingProducts = await db.select().from(products);
    
    if (existingProducts.length === 0) {
      console.log("Creating sample products...");
      await db.insert(products).values({
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
    }

    console.log("Database initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}
