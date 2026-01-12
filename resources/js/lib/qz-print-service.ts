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

export interface PaymentReceiptData {
    receipt_number: string;
    customer_name: string;
    invoices: Array<{
        date: string;
        number: string;
        amount: number;
        due_date: string;
    }>;
    total: number;
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

    private formatCurrency(num: number | string): string {
        const n = Number(num);
        if (isNaN(n)) return '0';
        return n.toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    }

    private formatQuantity(num: number | string): string {
        const n = Number(num);
        if (isNaN(n)) return '0';
        // Check if decimal
        if (n % 1 !== 0) {
            return n.toLocaleString('id-ID', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
            });
        }
        return n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
    }

    private terbilang(n: number): string {
        const bilangan = [
            '',
            'satu',
            'dua',
            'tiga',
            'empat',
            'lima',
            'enam',
            'tujuh',
            'delapan',
            'sembilan',
            'sepuluh',
            'sebelas',
        ];
        let temp = '';

        if (n < 12) {
            temp = ' ' + bilangan[n];
        } else if (n < 20) {
            temp = this.terbilang(n - 10) + ' belas';
        } else if (n < 100) {
            temp =
                this.terbilang(Math.floor(n / 10)) +
                ' puluh' +
                this.terbilang(n % 10);
        } else if (n < 200) {
            temp = ' seratus' + this.terbilang(n - 100);
        } else if (n < 1000) {
            temp =
                this.terbilang(Math.floor(n / 100)) +
                ' ratus' +
                this.terbilang(n % 100);
        } else if (n < 2000) {
            temp = ' seribu' + this.terbilang(n - 1000);
        } else if (n < 1000000) {
            temp =
                this.terbilang(Math.floor(n / 1000)) +
                ' ribu' +
                this.terbilang(n % 1000);
        } else if (n < 1000000000) {
            temp =
                this.terbilang(Math.floor(n / 1000000)) +
                ' juta' +
                this.terbilang(n % 1000000);
        }
        return temp;
    }

    async printRaw(data: PrintData, printerName: string) {
        await this.connect();
        const config = qz.configs.create(printerName);

        // Blade replicates: 32px padding ~ 3 blank lines
        let escp = [
            '\x1B\x40', // Initialize
            '\x1B\x43\x21', // Page length 33 lines
            '\x1B\x4D\x01', // 12 CPI
            '\n',
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
            line += rightLines[i] || '';
            escp.push(line + '\n');
        }
        escp.push('\n');

        // Table Header
        // Widths: No:4, QTY:10, Name:46, Price:12, Total:12. Separators: 6. Total: 90.
        escp.push(
            '--------------------------------------------------------------------------------------------\n',
        );
        escp.push(
            '| No |    QTY   | Nama Barang                                    |   Harga @  |   Jumlah   |\n',
        );
        escp.push(
            '+----+----------+------------------------------------------------+------------+------------+\n',
        );

        // Table Body - Exact 12 Rows
        const maxRows = 12;
        for (let i = 0; i < maxRows; i++) {
            let row = '|';
            const no = (i + 1).toString().padStart(2);
            row += ` ${no} |`;

            if (i < data.details.length) {
                const item = data.details[i];

                // QTY: 10 chars inner. " 1234 UOM "
                // Num: 6 chars right aligned
                // UOM: 3 chars left aligned
                // const qtyNum = this.formatCurrency(item.quantity).padStart(5);
                // const uomStr = item.uom.substring(0, 3).padEnd(3);
                // const qtyFinal = `${qtyNum} ${uomStr}`; // 5 + 1 + 3 = 9 chars? Need 10.
                // Let's do: margin 1 + 5 num + 1 space + 3 uom = 10.

                // Actually, let's just construct it directly into the cell space
                // Cell is 10 chars.
                // " 9999 PC " -> length 9.
                // Let's use 6 for num, 3 for UOM. " 9999 BOX" -> 9 chars?
                // Let's align cleanly: "   50 KTK "
                // const qNum = this.formatCurrency(item.quantity).padStart(5);
                const qUom = item.uom.substring(0, 3).padEnd(3);
                // const qtyCell = `${qNum} ${qUom}`; // 5+1+3 = 9 chars.
                // Add 1 char padding at end to make 10? Or center?
                // To align "angka sejajar", number must be fixed width right aligned.
                // "   50 KTK" -> 9 chars.
                // Header is 10. "    QTY   ".
                // Let's padStart 6 for num.
                const qNum6 = this.formatQuantity(item.quantity).padStart(6);
                const qtyStr = `${qNum6} ${qUom}`; // 6+1+3 = 10 chars. Exactly matches column.

                const nameStr = item.item_name.substring(0, 46).padEnd(46);
                const priceStr = this.formatCurrency(item.price).padStart(10);
                const subStr = this.formatCurrency(item.subtotal).padStart(10);

                row += `${qtyStr}| ${nameStr} | ${priceStr} | ${subStr} |`;
            } else {
                row += `          |                                                |            |            |`;
            }
            escp.push(row + '\n');
        }

        // Table Footer
        escp.push(
            '+----+----------+------------------------------------------------+------------+------------+\n',
        );

        // Terbilang and Total
        const terbilangText = this.terbilang(data.total).trim();
        const terbilangDisplay = terbilangText
            ? `Terbilang: ${terbilangText.charAt(0).toUpperCase() + terbilangText.slice(1)} Rupiah`
            : '';
        const totalLabel = 'Total: ';
        const totalValue = `Rp. ${this.formatCurrency(data.total)}`;

        // Word wrap logic
        const maxLen = 58;
        const words = terbilangDisplay.split(' ');
        const wrappedLines: string[] = [];
        let currentLine = '';

        words.forEach((word) => {
            if ((currentLine + word).length > maxLen) {
                wrappedLines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine.trim().length > 0) {
            wrappedLines.push(currentLine.trim());
        }
        if (wrappedLines.length === 0) wrappedLines.push('');

        // First line with Total
        const firstLine = wrappedLines[0];
        const footerLine1 =
            '| ' +
            firstLine.padEnd(62) +
            totalLabel +
            totalValue.padStart(20) +
            '|';
        escp.push(footerLine1 + '\n');

        // Subsequent lines (if any) with empty Total space
        for (let i = 1; i < wrappedLines.length; i++) {
            const nextLine = wrappedLines[i];
            // 7 (Total:) + 20 (Value) = 27 spaces
            const footerLineNext =
                '| ' + nextLine.padEnd(62) + ''.padEnd(27) + '|';
            escp.push(footerLineNext + '\n');
        }

        escp.push(
            '--------------------------------------------------------------------------------------------\n\n',
        );

        // Signatures
        escp.push(
            '       Tanda Terima        Dikeluarkan           Diperiksa               Supir\n\n\n',
        );
        escp.push(
            '      ______________      ______________        ______________        ______________\n',
        );

        escp.push('\x0C');

        await qz.print(config, escp);
    }

    async printPaymentReceipt(data: PaymentReceiptData, printerName: string) {
        await this.connect();
        const config = qz.configs.create(printerName);

        let escp = [
            '\x1B\x40', // Initialize
            '\x1B\x43\x21', // Page length 33 lines
            '\x1B\x4D\x01', // 12 CPI
            '\n',
        ];

        // Header - centered within 90 chars
        const headerText = 'TANDA TERIMA FAKTUR';
        const headerPadding = Math.floor((90 - headerText.length - data.receipt_number.length - 4) / 2);
        escp.push(' '.repeat(headerPadding) + headerText + '    ' + data.receipt_number + '\n');
        escp.push('\n');
        escp.push('Telah diterima dari MANDOR JAYA / Faktur Penjualan Asli, dengan\n');
        escp.push('perincian sebagai berikut :\n');
        escp.push('\n');

        // Table Header - Total width 90 chars without separators
        escp.push(
            '==========================================================================================\n',
        );
        escp.push(
            ' NO.  TGL. FAKTUR    NO FAKTUR                  JUMLAH          JT.TEMPO\n',
        );
        escp.push(
            '==========================================================================================\n',
        );

        // Table Body
        data.invoices.forEach((invoice, index) => {
            const no = `${index + 1}.`.padEnd(5);
            const date = invoice.date.padEnd(15);
            const number = invoice.number.padEnd(25);
            const amount = this.formatCurrency(invoice.amount).padStart(15);
            const dueDate = invoice.due_date.padEnd(15);

            escp.push(`${no} ${date} ${number} ${amount}  ${dueDate}\n`);
        });

        escp.push('\n');
        escp.push(
            '--------------- ----------------------- --------------- ----------------------------------\n'
        );

        // Total row - align with JUMLAH column
        // NO(5) + TGL(15) + NO FAKTUR(25) = 45 chars before JUMLAH
        const totalLabel = 'TOTAL FAKTUR ...';
        const totalValue = this.formatCurrency(data.total).padStart(15);
        const paddingBeforeTotal = 45 - totalLabel.length;
        escp.push(`${totalLabel}${' '.repeat(paddingBeforeTotal)}${totalValue}\n`);
        escp.push(
            '==========================================================================================\n',
        );
        escp.push('\n');

        // Terbilang - word wrap to fit 90 chars
        const terbilangText = this.terbilang(data.total).trim();
        const terbilangDisplay = terbilangText
            ? `Terbilang : ${terbilangText.charAt(0).toUpperCase() + terbilangText.slice(1)} Rupiah`
            : '';

        // Word wrap terbilang
        const maxLen = 88;
        const words = terbilangDisplay.split(' ');
        let currentLine = '';
        words.forEach((word) => {
            if ((currentLine + word).length > maxLen) {
                escp.push(currentLine.trim() + '\n');
                currentLine = word + ' ';
            } else {
                currentLine += word + ' ';
            }
        });
        if (currentLine.trim().length > 0) {
            escp.push(currentLine.trim() + '\n');
        }
        escp.push('\n\n');

        // Footer - aligned similar to Sale format
        escp.push('       Tanda Terima        Dikeluarkan           Diperiksa               Supir\n\n\n');
        escp.push('      ______________      ______________        ______________        ______________\n');
        escp.push('\n');
        escp.push('Tagih Tgl _____________________                                   MAKMUR JAYA / 081370586286\n');

        escp.push('\x0C'); // Form feed

        await qz.print(config, escp);
    }
}

export const qzPrintService = new QZPrintService();
