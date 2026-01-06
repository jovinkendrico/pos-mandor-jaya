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

export function parseStringtoDecimal(input: string): number | null {
    let sanitized = input.replace(/[^0-9,]/g, '');

    const parts = sanitized.split(',');
    if (parts.length > 2) {
        sanitized = parts[0] + ',' + parts.slice(1).join('');
    }

    if (!sanitized || sanitized === ',') {
        return null;
    }

    const normalized = sanitized.replace(',', '.');
    const result = parseFloat(normalized);

    return isNaN(result) ? null : result;
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
    return (
        'Rp. ' +
        input.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        })
    );
}

export function formatNumber(input: number): number {
    return Math.round(input);
}

export function formatNumberWithSeparator(input: number): string {
    if (typeof input === 'string') {
        return Number(input).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 4,
        });
    }
    return input.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

export function formatDate(dateString: Date) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function formatDiscount(input: string) {
    if (input.endsWith(',')) return input;

    let parsedInput = parseStringtoDecimal(input);

    if (parsedInput === null) {
        return '0';
    } else {
        if (parsedInput > 100) {
            parsedInput = 100;
        } else if (parsedInput < 0) {
            parsedInput = 0;
        }
    }

    // Return as string with comma separator for Indonesian locale
    return parsedInput.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

export function formatDatetoString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
