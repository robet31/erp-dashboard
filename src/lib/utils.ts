// src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency to Indonesian Rupiah
export function formatRupiah(amount: number): string {
  if (!amount && amount !== 0) return 'Rp 0';
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(0)}M`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}K`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatRupiahFull(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date to Indonesian format
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

// Get status badge class
export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'To Deliver and Bill': 'badge-info',
    'To Deliver': 'badge-warning',
    'To Bill': 'badge-purple',
    'Completed': 'badge-success',
    'Cancelled': 'badge-danger',
    'Draft': 'badge-gray',
    'Submitted': 'badge-success',
    'Not Started': 'badge-gray',
    'In Process': 'badge-info',
    'Not Delivered': 'badge-warning',
    'Fully Delivered': 'badge-success',
    'Partially Delivered': 'badge-purple',
    'Closed': 'badge-gray',
    'Stopped': 'badge-danger',
    'Not Billed': 'badge-warning',
    'Active': 'badge-success',
    'Disabled': 'badge-gray',
    'Pending': 'badge-warning',
    'Open': 'badge-info',
    'Work In Progress': 'badge-info',
    'Completed Work Order': 'badge-success',
  };
  return map[status] || 'badge-gray';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    'To Deliver and Bill': 'Siap Kirim',
    'To Deliver': 'Perlu Kirim',
    'To Bill': 'Perlu Invoice',
    'Completed': 'Selesai',
    'Cancelled': 'Dibatalkan',
    'Draft': 'Draft',
    'Submitted': 'Submitted',
    'Not Started': 'Belum Mulai',
    'In Process': 'Dalam Proses',
    'Not Delivered': 'Belum Terkirim',
    'Fully Delivered': 'Terkirim',
    'Active': 'Aktif',
    'Open': 'Open',
    'Work In Progress': 'Dalam Proses',
    'Closed': 'Selesai',
    'Stopped': 'Dihentikan',
  };
  return map[status] || status;
}

// Get work order progress
export function getWorkOrderProgress(produced: number, total: number): number {
  if (!total) return 0;
  return Math.min(Math.round((produced / total) * 100), 100);
}

// Get initials from name
export function getInitials(name: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// Truncate text
export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// Shorten name - only shorten if more than 10 chars, filter special chars
export function shortenName(name: string, maxLength: number = 20): string {
  if (!name) return '';
  
  // Filter only letters, numbers, and spaces
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, '').trim();
  if (!cleanName) return 'User';
  
  const charCount = cleanName.replace(/\s/g, '').length;
  
  // Don't shorten if 10 chars or less
  if (charCount <= 10) return cleanName;
  
  const parts = cleanName.split(/\s+/);
  if (parts.length === 1) {
    return cleanName.substring(0, maxLength - 2) + '..';
  }
  
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  const shortName = `${firstName} ${lastInitial}.`;
  if (shortName.length <= maxLength) return shortName;
  
  return firstName.substring(0, maxLength - 2) + '..';
}

// Generate random color for avatar
export function getAvatarColor(name: string): string {
  const colors = [
    '#0066B3', '#059669', '#d97706', '#7c3aed', '#dc2626',
    '#0891b2', '#65a30d', '#ea580c', '#9333ea', '#e11d48',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Check if stock is low
export function isLowStock(qty: number, threshold = 10): boolean {
  return qty <= threshold;
}

// Format number with comma
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}
