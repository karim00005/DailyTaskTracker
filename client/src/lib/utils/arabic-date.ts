// Mapping for Arabic day names
const arabicDays = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

// Mapping for Arabic month names
const arabicMonths = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر'
];

/**
 * Convert English numerals to Arabic numerals
 */
export function toArabicNumerals(num: number | string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (w) => arabicNumerals[+w]);
}

/**
 * Format a date in Arabic format
 * e.g., "الأحد، ١٠ يناير ٢٠٢٣"
 */
export function formatDateArabic(date: Date, includeDay = true): string {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const dayOfWeek = date.getDay();

  const arabicDay = toArabicNumerals(day);
  const arabicYear = toArabicNumerals(year);
  const arabicMonth = arabicMonths[month];
  const arabicDayName = arabicDays[dayOfWeek];

  if (includeDay) {
    return `${arabicDayName}، ${arabicDay} ${arabicMonth} ${arabicYear}`;
  }
  
  return `${arabicDay} ${arabicMonth} ${arabicYear}`;
}

/**
 * Format a date in short Arabic format
 * e.g., "١٠/٠١/٢٠٢٣"
 */
export function formatDateShortArabic(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${toArabicNumerals(day)}/${toArabicNumerals(month)}/${toArabicNumerals(year)}`;
}

/**
 * Format a time in Arabic format
 * e.g., "٠٢:٣٠ م"
 */
export function formatTimeArabic(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  const period = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;
  
  const arabicHours = toArabicNumerals(hours12.toString().padStart(2, '0'));
  const arabicMinutes = toArabicNumerals(minutes.toString().padStart(2, '0'));
  
  return `${arabicHours}:${arabicMinutes} ${period}`;
}
