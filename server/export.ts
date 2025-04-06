import { Request, Response } from 'express';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db';
import { clients, products, invoices, invoiceItems, transactions } from '@shared/schema';

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary directory for export files if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Excel export function
export async function exportExcelData(req: Request, res: Response) {
  try {
    const { type } = req.query;
    
    if (!type) {
      return res.status(400).json({ success: false, message: 'نوع التصدير مطلوب' });
    }
    
    const workbook = XLSX.utils.book_new();
    const filename = `${type}_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const filepath = path.join(TEMP_DIR, filename);
    
    // Export based on type
    switch (type) {
      case 'clients':
        await exportClients(workbook);
        break;
      case 'products':
        await exportProducts(workbook);
        break;
      case 'invoices':
        await exportInvoices(workbook);
        break;
      case 'transactions':
        await exportTransactions(workbook);
        break;
      case 'all':
        await exportAll(workbook);
        break;
      default:
        return res.status(400).json({ success: false, message: 'نوع التصدير غير صالح' });
    }
    
    // Write to file
    XLSX.writeFile(workbook, filepath);
    
    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        return res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال الملف' });
      }
      
      // Delete file after sending
      setTimeout(() => {
        fs.unlink(filepath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      }, 10000);
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ أثناء تصدير البيانات' });
  }
}

// Export clients
async function exportClients(workbook: XLSX.WorkBook) {
  const data = await db.select().from(clients);
  const worksheet = XLSX.utils.json_to_sheet(data.map(client => ({
    name: client.name,
    type: client.type,
    accountType: client.accountType,
    code: client.code,
    taxNumber: client.taxId,
    balance: client.balance,
    address: client.address,
    city: client.city,
    phone: client.phone,
    mobile: client.mobile,
    email: client.email,
    notes: client.notes,
    isActive: client.isActive
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'العملاء');
}

// Export products
async function exportProducts(workbook: XLSX.WorkBook) {
  const data = await db.select().from(products);
  const worksheet = XLSX.utils.json_to_sheet(data.map(product => ({
    code: product.code,
    name: product.name,
    description: product.description,
    unit: product.unitOfMeasure,
    category: product.category,
    basePrice: product.costPrice,
    sellingPrice: product.sellPrice1,
    wholesalePrice: product.sellPrice2,
    stock: product.stockQuantity,
    minStock: product.reorderLevel,
    isActive: product.isActive
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المنتجات');
}

// Export invoices and items
async function exportInvoices(workbook: XLSX.WorkBook) {
  const invoicesData = await db.select().from(invoices);
  const invoiceItemsData = await db.select().from(invoiceItems);
  
  // Create invoices worksheet
  const invoicesWorksheet = XLSX.utils.json_to_sheet(invoicesData.map(invoice => ({
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    clientId: invoice.clientId,
    warehouseId: invoice.warehouseId,
    date: invoice.date,
    time: invoice.time,
    paymentMethod: invoice.paymentMethod,
    userId: invoice.userId,
    total: invoice.total,
    discount: invoice.discount,
    tax: invoice.tax,
    grandTotal: invoice.grandTotal,
    paid: invoice.paid,
    balance: invoice.balance,
    notes: invoice.notes
  })));
  
  // Create invoice items worksheet
  const itemsWorksheet = XLSX.utils.json_to_sheet(invoiceItemsData.map(item => ({
    invoiceId: item.invoiceId,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
    tax: item.tax,
    total: item.total
  })));
  
  XLSX.utils.book_append_sheet(workbook, invoicesWorksheet, 'الفواتير');
  XLSX.utils.book_append_sheet(workbook, itemsWorksheet, 'بنود الفواتير');
}

// Export transactions
async function exportTransactions(workbook: XLSX.WorkBook) {
  const data = await db.select().from(transactions);
  const worksheet = XLSX.utils.json_to_sheet(data.map(transaction => ({
    transactionNumber: transaction.transactionNumber,
    transactionType: transaction.transactionType,
    clientId: transaction.clientId,
    date: transaction.date,
    time: transaction.time,
    amount: transaction.amount,
    paymentMethod: transaction.paymentMethod,
    reference: transaction.reference,
    bank: transaction.bank,
    notes: transaction.notes,
    userId: transaction.userId
  })));
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'المعاملات');
}

// Export all data
async function exportAll(workbook: XLSX.WorkBook) {
  await exportClients(workbook);
  await exportProducts(workbook);
  await exportInvoices(workbook);
  await exportTransactions(workbook);
}