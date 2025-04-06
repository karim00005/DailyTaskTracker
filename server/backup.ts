import { db } from './db';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { exec } from 'child_process';
import { Request, Response } from 'express';
import { Readable } from 'stream';
import { users, clients, products, warehouses, invoices, invoiceItems, transactions, settings } from '@shared/schema';
import { IncomingForm } from 'formidable';
import { fileURLToPath } from 'url';

const streamPipeline = promisify(pipeline);
const execPromise = promisify(exec);
const writeFilePromise = promisify(fs.writeFile);
const readFilePromise = promisify(fs.readFile);
const unlinkPromise = promisify(fs.unlink);

// Get current file's directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create temporary directory for backup files if it doesn't exist
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper to export a table from the database
async function exportTable(tableName: string, filePath: string) {
  try {
    const result = await db.select().from(eval(tableName));
    await writeFilePromise(filePath, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error exporting table ${tableName}:`, error);
    throw error;
  }
}

// Helper to import data into a table
async function importTable(tableName: string, data: any[]) {
  try {
    // Clear existing data
    await db.delete(eval(tableName));
    
    // Insert new data if there's any
    if (data.length > 0) {
      await db.insert(eval(tableName)).values(data);
    }
  } catch (error) {
    console.error(`Error importing table ${tableName}:`, error);
    throw error;
  }
}

// Create backup handler
export async function createBackup(req: Request, res: Response) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupDir = path.join(TEMP_DIR, `backup_${timestamp}`);
  const zipFilePath = path.join(TEMP_DIR, `backup_${timestamp}.zip`);
  
  try {
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Export tables to JSON files
    await Promise.all([
      exportTable('users', path.join(backupDir, 'users.json')),
      exportTable('clients', path.join(backupDir, 'clients.json')),
      exportTable('products', path.join(backupDir, 'products.json')),
      exportTable('warehouses', path.join(backupDir, 'warehouses.json')),
      exportTable('invoices', path.join(backupDir, 'invoices.json')),
      exportTable('invoiceItems', path.join(backupDir, 'invoiceItems.json')),
      exportTable('transactions', path.join(backupDir, 'transactions.json')),
      exportTable('settings', path.join(backupDir, 'settings.json')),
    ]);
    
    // Create manifest file with metadata
    const manifest = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: ['users', 'clients', 'products', 'warehouses', 'invoices', 'invoiceItems', 'transactions', 'settings']
    };
    await writeFilePromise(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    
    // Create zip file from backup directory
    await execPromise(`zip -r ${zipFilePath} *`, { cwd: backupDir });
    
    // Read the zip file and send it as response
    const fileStream = fs.createReadStream(zipFilePath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="SahlBackup_${timestamp}.SahlBackup3"`);
    
    await streamPipeline(fileStream, res);
    
    // Clean up
    fs.rm(backupDir, { recursive: true, force: true }, (err) => {
      if (err) console.error('Error removing backup directory:', err);
    });
    fs.unlink(zipFilePath, (err) => {
      if (err) console.error('Error removing zip file:', err);
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    // Clean up on error
    try {
      fs.rm(backupDir, { recursive: true, force: true }, () => {});
      fs.unlink(zipFilePath, () => {});
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    // If headers are not sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  }
}

// Restore backup handler
export async function restoreBackup(req: Request, res: Response) {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const extractDir = path.join(TEMP_DIR, `restore_${timestamp}`);
  const uploadedFilePath = path.join(TEMP_DIR, `uploaded_${timestamp}.SahlBackup3`);
  
  try {
    // Create the extract directory
    fs.mkdirSync(extractDir, { recursive: true });
    
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
    
    if (!files.backupFile) {
      throw new Error('No backup file was uploaded');
    }
    
    // Rename uploaded file for consistency
    const uploadedFile = files.backupFile[0];
    fs.renameSync(uploadedFile.filepath, uploadedFilePath);
    
    // Extract the zip file
    await execPromise(`unzip -o ${uploadedFilePath} -d ${extractDir}`);
    
    // Verify manifest
    const manifestPath = path.join(extractDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Invalid backup file: manifest not found');
    }
    
    const manifest = JSON.parse(await readFilePromise(manifestPath, 'utf8'));
    if (!manifest.version || !manifest.tables || !Array.isArray(manifest.tables)) {
      throw new Error('Invalid backup file: incorrect manifest format');
    }
    
    // Restore each table
    for (const tableName of manifest.tables) {
      const dataPath = path.join(extractDir, `${tableName}.json`);
      if (!fs.existsSync(dataPath)) {
        console.warn(`Warning: Table data file not found for ${tableName}`);
        continue;
      }
      
      const tableData = JSON.parse(await readFilePromise(dataPath, 'utf8'));
      await importTable(tableName, tableData);
    }
    
    // Clean up
    fs.rm(extractDir, { recursive: true, force: true }, (err) => {
      if (err) console.error('Error removing extract directory:', err);
    });
    fs.unlink(uploadedFilePath, (err) => {
      if (err) console.error('Error removing uploaded file:', err);
    });
    
    res.status(200).json({ success: true, message: 'Backup restored successfully' });
  } catch (error: any) {
    console.error('Error restoring backup:', error);
    
    // Clean up on error
    try {
      fs.rm(extractDir, { recursive: true, force: true }, () => {});
      fs.unlink(uploadedFilePath, () => {});
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to restore backup', 
      error: error.message 
    });
  }
}