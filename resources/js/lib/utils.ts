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
    if (input === null || isNaN(input)) {
        return 'Rp. ';
    }

    if (typeof input === 'string') {
        return 'Rp. ' + Number(input).toLocaleString('id-ID');
    }

    return 'Rp. ' + input.toLocaleString('id-ID');
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
