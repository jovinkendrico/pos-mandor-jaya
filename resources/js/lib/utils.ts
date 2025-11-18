import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function parseCurrency(input: string): number | null {
    const rawString = input.replace(/[^0-9]/g, '');

    if (!rawString) {
        return null;
    }

    return parseInt(rawString, 10);
}

export function formatCurrency(input: number | null | undefined): string {
    if (input === null || input === undefined) {
        return 'Rp. 0';
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
