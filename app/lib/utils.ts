import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatInTimeZone(date: Date | string | number, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d).replace(',', '');
}

export function generateLoanNumber(counter?: number): string {
  const prefix = 'EF';
  if (counter !== undefined && counter > 0) {
    return `${prefix}-${counter.toString().padStart(3, '0')}`;
  }
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${random}`;
}

export function formatShortLoanNumber(loanNumber?: string | null): string {
  if (!loanNumber) return '';
  const clean = loanNumber.trim();
  
  // Si ya tiene formato corto tipo EF-001, P-001, ESF-2024-001, etc.
  const shortMatch = clean.match(/^([A-Z]+)-0*(\d+)$/i);
  if (shortMatch) {
    const prefix = shortMatch[1].toUpperCase();
    const num = shortMatch[2];
    return `${prefix}-${num.padStart(3, '0')}`;
  }

  // Si tiene formato con guiones tipo EF-84384920-123 o MIG-IMG-SAN-9482
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const firstPart = parts[0].toUpperCase();
    if (/^\d+$/.test(lastPart)) {
      return `${firstPart}-${lastPart.padStart(3, '0')}`;
    }
  }

  // Si termina en dígitos
  const digitsMatch = clean.match(/\d+$/);
  if (digitsMatch) {
    return `EF-${digitsMatch[0].slice(-4).padStart(3, '0')}`;
  }

  return clean;
}