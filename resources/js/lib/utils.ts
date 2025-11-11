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

export function formatCurrency(input: number | null): string {
    if (!input && input !== 0) {
        return 'Rp. ';
    }

    return 'Rp. ' + input.toLocaleString('id-ID');
}

export function formatNumber(input: number): number {
    return Math.round(input);
}

export function formatNumberWithSeparator(input: number): string {
    return input.toLocaleString('id-ID');
}

export function formatDate(dateString: Date) {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
