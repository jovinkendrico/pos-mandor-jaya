import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function parseStringtoNumber(input: string): number | null {
    const rawString = input.replace(/[^0-9]/g, '');

    if (!rawString) {
        return null;
    }

    return parseInt(rawString, 10);
}

export function parseCurrency(input: string): number | null {
    if (!input || typeof input !== 'string') {
        return null;
    }

    // Remove currency symbols, spaces, and non-numeric characters except dots and commas
    const cleaned = input.replace(/[^\d.,]/g, '');
    
    // Remove dots (thousand separators) and replace comma with dot (decimal separator)
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    
    if (!normalized) {
        return null;
    }

    const parsed = parseFloat(normalized);
    
    return isNaN(parsed) ? null : parsed;
}

export function formatCurrency(input: number | null | undefined): string {
    if (input === null || input === undefined || isNaN(input as number)) {
        return 'Rp. 0';
    }

    // Handle string input
    if (typeof input === 'string') {
        return 'Rp. ' + Number(input).toLocaleString('id-ID');
    }

    // Round to 2 decimal places and format
    const rounded = Math.round(input * 100) / 100;
    return 'Rp. ' + rounded.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

export function formatNumber(input: number): number {
    return Math.round(input);
}

export function formatNumberWithSeparator(input: number): string {
    if (typeof input === 'string') {
        return Number(input).toLocaleString('id-ID');
    }
    return input.toLocaleString('id-ID');
}

export function formatDate(dateString: Date) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatDiscount(input: string) {
    let parsedInput = parseStringtoNumber(input);

    if (!parsedInput) {
        parsedInput = 0;
    } else {
        if (parsedInput > 100) {
            parsedInput = 100;
        } else if (parsedInput < 0) {
            parsedInput = 0;
        }
    }

    return parsedInput;
}
