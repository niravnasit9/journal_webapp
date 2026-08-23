/**
 * Centralized Date Utility
 * Provides standard date formatters and parsers ensuring timezone consistency
 */

/**
 * Format a Date object, ISO string, or Firestore Timestamp into a standardized output:
 * e.g., "Aug 23, 2026 • 14:30"
 */
export const formatTradeDate = (dateVal: any): string => {
  if (!dateVal) return "N/A";
  
  let dateObj: Date;
  
  if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    dateObj = new Date(dateVal);
  } else if (dateVal.toMillis) {
    // Firestore Timestamp
    dateObj = new Date(dateVal.toMillis());
  } else {
    dateObj = new Date(dateVal);
  }

  if (isNaN(dateObj.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj).replace(', ', ' • ');
};

/**
 * Returns a standardized local JS Date from whatever is passed.
 */
export const getLocalJsDate = (dateVal: any): Date | null => {
  if (!dateVal) return null;
  let dateObj: Date;
  
  if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    dateObj = new Date(dateVal);
  } else if (dateVal.toMillis) {
    dateObj = new Date(dateVal.toMillis());
  } else {
    dateObj = new Date(dateVal);
  }

  return isNaN(dateObj.getTime()) ? null : dateObj;
};

/**
 * Helper to get the start of the current day.
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Returns a human-readable duration string from open to close time.
 * e.g., '45m', '2h 15m', or '3d 4h'
 */
export const getTradeDuration = (openTime: any, closeTime: any): string => {
  const openDate = getLocalJsDate(openTime);
  const closeDate = getLocalJsDate(closeTime);
  
  if (!openDate || !closeDate) return "N/A";
  
  const diffMs = closeDate.getTime() - openDate.getTime();
  if (diffMs < 0) return "N/A";
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMins / (24 * 60));
  const hours = Math.floor((diffMins % (24 * 60)) / 60);
  const mins = diffMins % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || (days === 0 && hours === 0)) parts.push(`${mins}m`);
  
  return parts.join(" ") || "0m";
};
