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

    if (normalized === '') {
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

export function formatDiscount(input: string): number | string {
    if (input.endsWith(',')) return input;

    let parsedInput = parseStringtoDecimal(input);

    if (parsedInput === null) {
        return 0;
    } else {
        if (parsedInput > 100) {
            parsedInput = 100;
        } else if (parsedInput < 0) {
            parsedInput = 0;
        }
    }

    return parsedInput;
}

export function formatDiscountDisplay(value: number): string {
    return value.toLocaleString('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

export function formatDatetoString(date: Date | string) {
    // If already a YYYY-MM-DD string, return as-is to avoid timezone shift
    if (typeof date === 'string') {
        // If it's already a YYYY-MM-DD string, return directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
        }
        // Otherwise parse it safely using local time
        const parsed = new Date(date);
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Date object: use local time methods
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Compress image on the client side
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.6): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas to Blob failed'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}
