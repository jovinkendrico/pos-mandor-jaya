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

export function formatCurrency(input: number | null): string {
    if (!input) {
        return 'Rp. ';
    }

    return 'Rp. ' + input.toLocaleString('id-ID');
}
