import qz from 'qz-tray';

export interface PrintData {
    sale_number?: string;
    purchase_number?: string;
    date: string;
    due_date?: string;
    customer_name?: string;
    customer_city?: string;
    customer_phone?: string;
    supplier_name?: string;
    supplier_city?: string;
    supplier_phone?: string;
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
            await qz.websocket.connect({
                host: 'localhost',
                port: {
                    secure: [8181],
                    insecure: [8182]
                }
            });
            this.connected = true;
        } catch (e) {
            console.error('QZ Tray connection failed', e);
            throw new Error('Gagal terhubung ke QZ Tray di localhost. Pastikan aplikasi QZ Tray sudah jalan dan port 8181/8182 sudah terbuka.');
        }
    }

    private formatCurrency(num: number): string {
        return num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    private terbilang(n: number): string {
        const bilangan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
        let temp = '';

        if (n < 12) {
            temp = ' ' + bilangan[n];
        } else if (n < 20) {
            temp = this.terbilang(n - 10) + ' belas';
        } else if (n < 100) {
            temp = this.terbilang(Math.floor(n / 10)) + ' puluh' + this.terbilang(n % 10);
        } else if (n < 200) {
            temp = ' seratus' + this.terbilang(n - 100);
        } else if (n < 1000) {
            temp = this.terbilang(Math.floor(n / 100)) + ' ratus' + this.terbilang(n % 100);
        } else if (n < 2000) {
            temp = ' seribu' + this.terbilang(n - 1000);
        } else if (n < 1000000) {
            temp = this.terbilang(Math.floor(n / 1000)) + ' ribu' + this.terbilang(n % 1000);
        } else if (n < 1000000000) {
            temp = this.terbilang(Math.floor(n / 1000000)) + ' juta' + this.terbilang(n % 1000000);
        }
        return temp;
    }

    async printRaw(data: PrintData, printerName: string) {
        await this.connect();
        const config = qz.configs.create(printerName);

        // Blade replicates: 32px padding ~ 3 blank lines
        let escp = [
            '\x1B\x40',          // Initialize
            '\x1B\x43\x21',      // Page length 33 lines
            '\x1B\x4D\x01',      // 12 CPI
            '\n\n\n',            // Top padding
        ];

        // Header and Info Sections
        const leftColWidth = 45;
        const leftLines = [
            `No. Faktur  : ${data.sale_number || data.purchase_number || '-'}`,
            `Tanggal     : ${data.date}`,
            `Jatuh Tempo : ${data.due_date || '-'}`,
        ];

        const rightLines = [
            `Kepada Yth.`,
            `${data.customer_name || data.supplier_name || '-'}`,
            `${data.customer_city || data.supplier_city || '-'}`,
            `${data.customer_phone || data.supplier_phone || '-'}`,
        ];

        const maxInfoLines = Math.max(leftLines.length, rightLines.length);
        for (let i = 0; i < maxInfoLines; i++) {
            let line = '';
            line += (leftLines[i] || '').padEnd(leftColWidth);
            line += (rightLines[i] || '');
            escp.push(line + '\n');
        }
        escp.push('\n');

        // Table Header
        escp.push('--------------------------------------------------------------------------------------\n');
        escp.push('| No |   Quantity   | Nama Barang                              |   Harga @  |   Jumlah   |\n');
        escp.push('+----+--------------+------------------------------------------+------------+------------+\n');

        // Table Body - Exact 12 Rows
        const maxRows = 12;
        for (let i = 0; i < maxRows; i++) {
            let row = '|';
            const no = (i + 1).toString().padStart(2);
            row += ` ${no} |`;

            if (i < data.details.length) {
                const item = data.details[i];
                const qtyStr = `${item.quantity} ${item.uom}`.substring(0, 12).padEnd(12);
                const nameStr = item.item_name.substring(0, 40).padEnd(40);
                const priceStr = this.formatCurrency(item.price).padStart(10);
                const subStr = this.formatCurrency(item.subtotal).padStart(10);

                row += ` ${qtyStr} | ${nameStr} | ${priceStr} | ${subStr} |`;
            } else {
                row += `              |                                          |            |            |`;
            }
            escp.push(row + '\n');
        }

        // Table Footer
        escp.push('--------------------------------------------------------------------------------------\n');

        // Terbilang and Total
        const terbilangText = this.terbilang(data.total).trim();
        const terbilangDisplay = terbilangText ? `Terbilang: ${terbilangText.charAt(0).toUpperCase() + terbilangText.slice(1)} Rupiah` : '';
        const totalLabel = "Total: ";
        const totalValue = `Rp. ${this.formatCurrency(data.total)}`;

        const footerLine = '' + terbilangDisplay.substring(0, 60).padEnd(65) + totalLabel + totalValue.padStart(15);
        escp.push(footerLine + '\n\n');

        // Signatures
        escp.push('       Tanda Terima        Dikeluarkan           Diperiksa               Supir\n\n\n');
        escp.push('      (____________)      (____________)        (____________)        (____________)\n');

        escp.push('\x0C');

        await qz.print(config, escp);
    }
}

export const qzPrintService = new QZPrintService();
