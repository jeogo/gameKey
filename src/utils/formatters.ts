/**
 * Utility functions for formatting text, numbers, and other display elements
 */

/**
 * Format a number with thousands separators
 * @param value - The number to format
 * @returns Formatted number string with commas as separators
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/**
 * Format a price with currency symbol
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'GCoin')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string = 'GCoin'): string {
  const formattedAmount = formatNumber(amount);
  return `${formattedAmount} ${currency}`;
}

/**
 * Truncate text if it's too long
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a date in a localized format
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a timestamp in a relative way (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  const dateObj = typeof date === 'object' ? date : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  
  // Convert to seconds
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;
  
  // Convert to minutes
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  
  // Convert to hours
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  
  // Convert to days
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  
  // Convert to months
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  
  // Convert to years
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
}

/**
 * Add the GCoin branding to a number
 * @param amount - The GCoin amount
 * @returns Formatted GCoin string with branding
 */
export function formatGcoin(amount: number): string {
  return `${formatNumber(amount)} ${gcoinSymbol()}`;
}

/**
 * Get the GCoin symbol/brand text
 * @returns Stylized GCoin text
 */
export function gcoinSymbol(): string {
  return "GCoin";
}