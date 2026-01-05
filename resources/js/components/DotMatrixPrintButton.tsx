import { Button } from '@/components/ui/button';
import { qzPrintService, PrintData } from '@/lib/qz-print-service';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DotMatrixPrintButtonProps {
    data: PrintData;
    className?: string;
}

export default function DotMatrixPrintButton({ data, className }: DotMatrixPrintButtonProps) {
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = async () => {
        let printerName = localStorage.getItem('qz_printer_name');

        if (!printerName) {
            printerName = window.prompt('Masukkan Nama Printer Dot Matrix (cek di Control Panel):', 'Epson LX-310');
            if (!printerName) return;
            localStorage.setItem('qz_printer_name', printerName);
        }

        setIsPrinting(true);
        try {
            await qzPrintService.printRaw(data, printerName);
            toast.success('Faktur dikirim ke printer.');
        } catch (error: any) {
            toast.error(error.message || 'Gagal mencetak.');
            // Clear printer name on error to let user re-enter if it was wrong
            if (error.message?.includes('not find')) {
                localStorage.removeItem('qz_printer_name');
            }
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <Button
            variant="outline"
            className={className}
            onClick={handlePrint}
            disabled={isPrinting}
        >
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? 'Mencetak...' : 'Print Dot Matrix'}
        </Button>
    );
}
