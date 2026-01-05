import qz from 'qz-tray';

export interface PrintData {
    sale_number?: string;
    purchase_number?: string;
    date: string;
    due_date?: string;
    customer_name?: string;
    supplier_name?: string;
    details: Array<{
        item_name: string;
        uom: string;
        quantity: number;
        price: number;
        subtotal: number;
    }>;
    total: number;
    notes?: string;
}

class QZPrintService {
    private connected = false;

    async connect() {
        if (this.connected) return;
        try {
            // Secara eksplisit menetapkan host dan port sebelum koneksi
            // Sesuai laporan: wss di 8181 dan ws di 8182
            await qz.websocket.connect({
                host: '192.168.1.104',
                port: {
                    secure: [8181],
                    insecure: [8182]
                }
            });
            this.connected = true;
        } catch (e) {
            console.error('QZ Tray connection failed', e);
            throw new Error('Gagal terhubung ke QZ Tray di 192.168.1.104. Periksa koneksi wss://192.168.1.104:8181 atau ws://192.168.1.104:8182');
        }
    }

    async findPrinter(printerName: string = 'Epson') {
        await this.connect();
        return qz.printers.find(printerName);
    }

    private formatLine(left: string, right: string, width: number = 40): string {
        const spaceCount = width - left.length - right.length;
        if (spaceCount < 1) return left + " " + right;
        return left + " ".repeat(spaceCount) + right;
    }

    private formatCurrency(num: number): string {
        return num.toLocaleString('id-ID');
    }

    async printRaw(data: PrintData, printerName: string) {
        await this.connect();
        const config = qz.configs.create(printerName);

        const escp = [
            '\x1B\x40',          // Initialize printer
            '\x1B\x43\x21',      // Set page length to 33 lines (5.5 inches @ 6 LPI)
            '\x1B\x4D\x01',      // Select 12 cpi (Condensed)

            '      MANDOR JAYA\n',
            '--------------------------------\n',
            `No. Nota: ${data.sale_number || data.purchase_number}\n`,
            `Tanggal : ${data.date}\n`,
            `Pihak   : ${data.customer_name || data.supplier_name}\n`,
            '--------------------------------\n',
            'Item           Qty   Harga   Total\n',
            '--------------------------------\n',
        ];

        data.details.forEach((item, index) => {
            const qtyStr = `${item.quantity} ${item.uom}`;
            const priceStr = this.formatCurrency(item.price);
            const subtotalStr = this.formatCurrency(item.subtotal);

            // Line 1: Item Name
            escp.push(`${index + 1}. ${item.item_name}\n`);
            // Line 2: Details
            escp.push(`    ${qtyStr.padEnd(8)} ${priceStr.padStart(8)} ${subtotalStr.padStart(10)}\n`);
        });

        escp.push('--------------------------------\n');
        escp.push(this.formatLine('TOTAL:', this.formatCurrency(data.total)) + '\n');

        if (data.notes) {
            escp.push(`Ket: ${data.notes}\n`);
        }

        escp.push('\n\n');
        escp.push('  Tanda Terima      Hormat Kami\n\n\n');
        escp.push(' (____________)    (____________)\n');
        escp.push('\x0C'); // Form Feed / Eject

        await qz.print(config, escp);
    }
}

export const qzPrintService = new QZPrintService();
