import { db } from './db';
import { fileURLToPath } from 'url';
import path from 'path';
import { Request, Response } from 'express';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import XLSX from 'xlsx';
import { users, clients, products, warehouses, invoices, invoiceItems, transactions, settings } from '@shared/schema';

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary directory for upload files if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Process products from Excel
export async function processProducts(worksheet: XLSX.WorkSheet, clearExisting: boolean = false) {
  try {
    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (!data || data.length === 0) {
      return { success: false, message: 'لا توجد بيانات للمنتجات في الملف' };
    }

    // Prepare products for insertion
    const productsToInsert = data.map((row: any) => ({
      code: row.code?.toString() || `P${Math.floor(Math.random() * 10000)}`,
      name: row.name || 'منتج بلا اسم',
      description: row.description || '',
      unitOfMeasure: row.unit || 'طن',
      category: row.category || 'عام',
      costPrice: (row.basePrice || '0').toString(),
      sellPrice1: (row.sellingPrice || '0').toString(),
      sellPrice2: (row.wholesalePrice || '0').toString(),
      stockQuantity: (row.stock || '0').toString(),
      reorderLevel: (row.minStock || '0').toString(),
      isActive: true
    }));

    // Clear existing products if requested
    if (clearExisting) {
      await db.delete(products);
    }

    // Insert new products
    if (productsToInsert.length > 0) {
      await db.insert(products).values(productsToInsert);
    }

    return { success: true, count: productsToInsert.length };
  } catch (error) {
    console.error('Error processing products:', error);
    return { success: false, message: 'حدث خطأ أثناء معالجة بيانات المنتجات' };
  }
}

// Process clients from Excel
export async function processClients(worksheet: XLSX.WorkSheet, clearExisting: boolean = false) {
  try {
    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (!data || data.length === 0) {
      return { success: false, message: 'لا توجد بيانات للعملاء في الملف' };
    }

    // Prepare clients for insertion
    const clientsToInsert = data.map((row: any) => ({
      name: row.name || 'عميل بلا اسم',
      type: row.type || 'عميل',
      accountType: row.accountType || 'مدين',
      code: row.code?.toString() || '',
      taxId: row.taxNumber?.toString() || '',
      balance: (row.balance || '0').toString(),
      address: row.address || '',
      city: row.city || '',
      phone: row.phone?.toString() || '',
      mobile: row.mobile?.toString() || '',
      email: row.email || '',
      notes: row.notes || '',
      isActive: row.isActive === false ? false : true
    }));

    // Clear existing clients if requested
    if (clearExisting) {
      await db.delete(clients);
    }

    // Insert new clients
    if (clientsToInsert.length > 0) {
      await db.insert(clients).values(clientsToInsert);
    }

    return { success: true, count: clientsToInsert.length };
  } catch (error) {
    console.error('Error processing clients:', error);
    return { success: false, message: 'حدث خطأ أثناء معالجة بيانات العملاء' };
  }
}

// Process transactions from Excel
export async function processTransactions(worksheet: XLSX.WorkSheet, clearExisting: boolean = false) {
  try {
    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (!data || data.length === 0) {
      return { success: false, message: 'لا توجد بيانات للمعاملات المالية في الملف' };
    }

    // Prepare transactions for insertion
    const transactionsToInsert = data.map((row: any) => {
      const now = new Date();
      const date = row.date ? new Date(row.date) : now;
      return {
        transactionNumber: row.transactionNumber?.toString() || `TR${Math.floor(Math.random() * 10000)}`,
        transactionType: row.type || 'صرف',
        clientId: parseInt(row.clientId) || 1,
        date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD string format
        time: now.toTimeString().split(' ')[0],
        amount: (row.amount || '0').toString(),
        paymentMethod: row.paymentMethod || 'تحويل بنكي',
        reference: row.reference?.toString() || '',
        bank: row.bank?.toString() || '',
        notes: row.notes || '',
        userId: 1
      };
    });

    // Clear existing transactions if requested
    if (clearExisting) {
      await db.delete(transactions);
    }

    // Insert new transactions
    if (transactionsToInsert.length > 0) {
      await db.insert(transactions).values(transactionsToInsert);
    }

    return { success: true, count: transactionsToInsert.length };
  } catch (error) {
    console.error('Error processing transactions:', error);
    return { success: false, message: 'حدث خطأ أثناء معالجة بيانات المعاملات المالية' };
  }
}

// Process invoices from Excel
export async function processInvoices(worksheet: XLSX.WorkSheet, itemsWorksheet: XLSX.WorkSheet | null, clearExisting: boolean = false) {
  try {
    // Convert worksheet to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    if (!data || data.length === 0) {
      return { success: false, message: 'لا توجد بيانات للفواتير في الملف' };
    }

    // Clear existing invoices and items if requested
    if (clearExisting) {
      await db.delete(invoiceItems);
      await db.delete(invoices);
    }

    // Prepare invoices for insertion
    const invoicesMap = new Map();
    for (const row of data as any[]) {
      const now = new Date();
      const date = row.date ? new Date(row.date) : now;
      const invoice = {
        invoiceNumber: row.invoiceNumber?.toString() || `INV${Math.floor(Math.random() * 10000)}`,
        invoiceType: row.invoiceType?.toString() || 'بيع',
        date: date.toISOString().split('T')[0], // Convert to YYYY-MM-DD string format
        time: now.toTimeString().split(' ')[0], // Current time in HH:MM:SS format
        warehouseId: parseInt(row.warehouseId) || 1,
        clientId: parseInt(row.clientId) || 1,
        paymentMethod: row.paymentMethod?.toString() || 'نقدي',
        total: (row.total || '0').toString(),
        discount: (row.discount || '0').toString(),
        tax: (row.tax || '0').toString(),
        grandTotal: (row.grandTotal || row.total || '0').toString(),
        paid: (row.paid || '0').toString(),
        balance: (row.balance || row.due || '0').toString(),
        notes: row.notes || '',
        userId: 1
      };

      try {
        // Insert invoice and keep track of its ID
        const result = await db.insert(invoices).values(invoice).returning();
        if (result && result.length > 0) {
          const newInvoice = result[0];
          invoicesMap.set(invoice.invoiceNumber, newInvoice.id);
        }
      } catch (error) {
        console.error("Error inserting invoice:", error);
      }
    }

    // Process invoice items if available
    if (itemsWorksheet) {
      const itemsData = XLSX.utils.sheet_to_json(itemsWorksheet);
      if (itemsData && itemsData.length > 0) {
        const itemsToInsert: any[] = [];
        for (const row of itemsData as any[]) {
          const invoiceNumber = row.invoiceNumber?.toString();
          if (invoiceNumber && invoicesMap.has(invoiceNumber)) {
            const invoiceId = invoicesMap.get(invoiceNumber);
            itemsToInsert.push({
              invoiceId,
              productId: parseInt(row.productId) || 1,
              quantity: (row.quantity || '0').toString(),
              unitPrice: (row.unitPrice || '0').toString(),
              discount: (row.discount || '0').toString(),
              tax: (row.tax || '0').toString(),
              total: (row.total || '0').toString()
            });
          }
        }

        // Bulk insert all items
        if (itemsToInsert.length > 0) {
          await db.insert(invoiceItems).values(itemsToInsert);
        }
      }
    }

    return { 
      success: true, 
      count: invoicesMap.size, 
      itemsProcessed: itemsWorksheet ? 'نعم' : 'لا' 
    };
  } catch (error) {
    console.error('Error processing invoices:', error);
    return { success: false, message: 'حدث خطأ أثناء معالجة بيانات الفواتير' };
  }
}

// Main import handler
export async function importExcelData(req: Request, res: Response) {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const uploadedFilePath = path.join(TEMP_DIR, `excel_${timestamp}.xlsx`);
    const excelFilePath = "D:\\DailyTaskTracker\\data\\input.xlsx"; // fixed unterminated string literal

    // Parse the incoming form data
    const form = new IncomingForm({
      uploadDir: TEMP_DIR,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
    });

    // Parse form and get the file
    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: any, files: any) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    if (!files.excelFile) {
      throw new Error('لم يتم رفع ملف Excel');
    }

    // Get import options from fields
    const importType = fields.importType ? fields.importType.toString() : 'all';
    const clearExisting = fields.clearExisting === 'true';
    console.log('Import options:', { importType, clearExisting });

    // Rename uploaded file for consistency
    const uploadedFile = Array.isArray(files.excelFile) ? files.excelFile[0] : files.excelFile;
    fs.renameSync(uploadedFile.filepath, uploadedFilePath);

    // Read the Excel file
    const workbook = XLSX.readFile(uploadedFilePath);
    const sheetNames = workbook.SheetNames;

    // Check if we have sheets
    if (!sheetNames || sheetNames.length === 0) {
      throw new Error('ملف Excel لا يحتوي على بيانات');
    }

    // Function to find sheet by pattern
    const findSheet = (patterns: string[]): string | null => {
      for (const sheet of sheetNames) {
        const sheetNameLower = sheet.toLowerCase();
        for (const pattern of patterns) {
          if (sheetNameLower.includes(pattern)) {
            return sheet;
          }
        }
      }
      return null;
    };

    // Process data based on import type
    const results: any = {};

    // Process clients if requested
    if (importType === 'all' || importType === 'clients') {
      const clientsSheet = findSheet(['عميل', 'عملاء', 'client', 'clients', 'العملاء']);
      if (clientsSheet) {
        results.clients = await processClients(workbook.Sheets[clientsSheet], clearExisting);
      }
    }

    // Process products if requested
    if (importType === 'all' || importType === 'products') {
      const productsSheet = findSheet(['منتج', 'منتجات', 'product', 'products', 'المنتجات']);
      if (productsSheet) {
        results.products = await processProducts(workbook.Sheets[productsSheet], clearExisting);
      }
    }

    // Process transactions if requested
    if (importType === 'all' || importType === 'transactions') {
      const transactionsSheet = findSheet(['معامل', 'معاملات', 'transaction', 'transactions', 'المعاملات']);
      if (transactionsSheet) {
        results.transactions = await processTransactions(workbook.Sheets[transactionsSheet], clearExisting);
      }
    }

    // Process invoices if requested
    if (importType === 'all' || importType === 'invoices') {
      const invoicesSheet = findSheet(['فاتور', 'فواتير', 'invoice', 'invoices', 'الفواتير']);
      if (invoicesSheet) {
        // Find related invoice items sheet
        const itemsSheet = findSheet(['بنود', 'عناصر', 'item', 'items', 'بنود الفواتير', 'invoice items']);
        const itemsWorksheet = itemsSheet ? workbook.Sheets[itemsSheet] : null;
        results.invoices = await processInvoices(workbook.Sheets[invoicesSheet], itemsWorksheet, clearExisting);
      }
    }

    // Clean up
    fs.unlink(uploadedFilePath, (err) => {
      if (err) console.error('Error removing uploaded file:', err);
    });

    res.status(200).json({
      success: true,
      message: 'تم استيراد البيانات بنجاح',
      results
    });
  } catch (error: any) {
    console.error('Error importing Excel data:', error);

    // Clean up on error
    try {
      fs.unlink(uploadedFilePath, () => {});
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }

    res.status(500).json({
      success: false,
      message: 'فشل في استيراد البيانات',
      error: error.message
    });
  }
}