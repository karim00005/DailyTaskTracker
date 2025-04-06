import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parse } from "date-fns";
import { ar } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to a string
 * @param date Date or date string to format
 * @param formatString Optional format string, default is dd/MM/yyyy
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, formatString = "dd/MM/yyyy"): string {
  if (!date) return "-";
  
  try {
    if (typeof date === "string") {
      // Check if the date is already in the desired format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
        return date;
      }
      
      // Try to parse the date string
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return "-";
      }
      
      return format(parsedDate, formatString, { locale: ar });
    }
    
    return format(date, formatString, { locale: ar });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
}

/**
 * Format a number as currency (SAR)
 * @param amount Number or numeric string to format
 * @param currencySymbol Optional currency symbol, default is ر.س
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string | null | undefined, currencySymbol = "ر.س"): string {
  if (amount === null || amount === undefined) return `0.00 ${currencySymbol}`;
  
  try {
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
      return `0.00 ${currencySymbol}`;
    }
    
    const formatted = new Intl.NumberFormat("ar-SA", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
    
    return `${formatted} ${currencySymbol}`;
  } catch (error) {
    console.error("Error formatting currency:", error);
    return `0.00 ${currencySymbol}`;
  }
}

/**
 * Generate a random string with specified length
 * @param length Length of the random string
 * @returns Random string
 */
export function generateRandomString(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Create a slug from a string by removing non-alphanumeric characters and replacing spaces with hyphens
 * @param str String to convert to slug
 * @returns Slug string
 */
export function createSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');
}
