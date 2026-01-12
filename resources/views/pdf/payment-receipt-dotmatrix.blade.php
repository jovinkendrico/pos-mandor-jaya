<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tanda Terima Faktur</title>
    <style>
        @page {
            size: 8.5in 11in;
            margin: 0.5in 0.5in 0.5in 0.5in;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000;
        }
        .header h1 {
            font-size: 14pt;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .header .receipt-number {
            font-size: 11pt;
            text-align: right;
            margin-top: 5px;
        }
        .company-info {
            margin-bottom: 15px;
            font-size: 10pt;
        }
        .customer-info {
            margin-bottom: 15px;
        }
        .customer-info p {
            margin: 2px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        table th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 5px 2px;
            text-align: left;
            font-size: 10pt;
        }
        table th.text-right {
            text-align: right;
        }
        table td {
            padding: 3px 2px;
            font-size: 10pt;
        }
        table td.text-right {
            text-align: right;
        }
        .total-row {
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
        }
        .summary {
            margin-top: 15px;
            padding: 10px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
        }
        .terbilang {
            margin: 15px 0;
            font-size: 10pt;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
        }
        .signature {
            margin-top: 60px;
            text-align: center;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    @foreach($receipts as $index => $receipt)
        <div class="header">
            <h1>TANDA TERIMA FAKTUR</h1>
            <div class="receipt-number">NO.TTA-{{ str_pad($index + 1, 4, '0', STR_PAD_LEFT) }}</div>
        </div>

        <div class="company-info">
            Telah diterima dari MANDOR JAYA / Faktur Penjualan Asli, dengan<br>
            perincian sebagai berikut :
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 5%">NO.</th>
                    <th style="width: 15%">TGL FAKTUR</th>
                    <th style="width: 20%">NO FAKTUR</th>
                    <th class="text-right" style="width: 20%">JUMLAH</th>
                    <th class="text-right" style="width: 20%">JT.TEMPO</th>
                </tr>
            </thead>
            <tbody>
                @foreach($receipt['invoices'] as $idx => $invoice)
                    <tr>
                        <td>{{ $idx + 1 }}.</td>
                        <td>{{ $invoice['sale_date'] }}</td>
                        <td>{{ $invoice['sale_number'] }}</td>
                        <td class="text-right">{{ number_format($invoice['remaining_amount'], 0, ',', '.') }}</td>
                        <td class="text-right">{{ $invoice['due_date'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row total-row">
                <span>TOTAL FAKTUR ...</span>
                <span>{{ number_format($receipt['summary']['total_remaining'], 0, ',', '.') }}</span>
            </div>
        </div>

        <div class="terbilang">
            Terbilang : {{ ucwords(\App\Helpers\NumberToWords::convert($receipt['summary']['total_remaining'])) }} Rupiah
        </div>

        <div class="footer">
            <p>Medan,</p>
            <p style="margin-top: 10px;">Hormat kami,</p>
            <div class="signature">
                <p>Tagih Tgl _____________________</p>
                <p style="margin-top: 40px;">MAKMUR JAYA / 081370586286</p>
            </div>
        </div>

        @if($index < count($receipts) - 1)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>
