import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import XLSX from 'xlsx';
import { db } from './db';
import { processProducts, processClients, processTransactions, processInvoices } from './import';

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file
const excelFilePath = path.join(__dirname, '../attached_assets/2025.xlsx');

async function testImport() {
  try {
    console.log(`Reading Excel file from: ${excelFilePath}`);
    if (!fs.existsSync(excelFilePath)) {
      console.error('Excel file not found!');
      return;
    }

    // Read the Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheetNames = workbook.SheetNames;
    
    console.log('Excel sheets:', sheetNames);
    
    // Results object to store processing results
    const results: any = {};
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      const lowerSheetName = sheetName.toLowerCase();
      console.log(`Processing sheet: ${sheetName}`);
      
      if (lowerSheetName.includes('product') || lowerSheetName.includes('منتج')) {
        results.products = await processProducts(workbook.Sheets[sheetName]);
        console.log('Products result:', results.products);
      } 
      else if (lowerSheetName.includes('client') || lowerSheetName.includes('عميل')) {
        results.clients = await processClients(workbook.Sheets[sheetName]);
        console.log('Clients result:', results.clients);
      }
      else if (lowerSheetName.includes('transaction') || lowerSheetName.includes('معامل')) {
        results.transactions = await processTransactions(workbook.Sheets[sheetName]);
        console.log('Transactions result:', results.transactions);
      }
      else if (lowerSheetName.includes('invoice') || lowerSheetName.includes('فاتور')) {
        // Find related invoice items sheet
        const itemsSheetName = sheetNames.find(name => 
          name.toLowerCase().includes('item') || 
          name.toLowerCase().includes('عناصر') ||
          name.toLowerCase().includes('بنود')
        );
        
        const itemsSheet = itemsSheetName ? workbook.Sheets[itemsSheetName] : null;
        results.invoices = await processInvoices(workbook.Sheets[sheetName], itemsSheet);
        console.log('Invoices result:', results.invoices);
      }
    }
    
    console.log('All results:', results);
  } catch (error) {
    console.error('Error testing import:', error);
  }
}

// Run the test
testImport();