/**
 * Export helper utilities for TablesCharts pages
 * Provides common export functionality for PDF, CSV, and config copying
 */

/**
 * Convert data to CSV format
 */
export function convertToCSV(
  data: Record<string, any>[],
  headers?: string[]
): string {
  if (data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const headerRow = keys.join(',');
  
  const rows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      // Handle values that contain commas, quotes, or newlines
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}

/**
 * Download a string as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download CSV file
 */
export function downloadCSV(
  data: Record<string, any>[],
  filename: string,
  headers?: string[]
): void {
  const csv = convertToCSV(data, headers);
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback method
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Copy JSON config to clipboard
 */
export async function copyConfigToClipboard(config: Record<string, any>): Promise<boolean> {
  const jsonString = JSON.stringify(config, null, 2);
  return copyToClipboard(jsonString);
}

/**
 * Generate a filename with timestamp
 */
export function generateTimestampedFilename(
  prefix: string,
  extension: string
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitize filename by removing invalid characters
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_');
}

/**
 * Create a download link for blob data
 */
export function downloadBlob(
  blob: Blob,
  filename: string
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
