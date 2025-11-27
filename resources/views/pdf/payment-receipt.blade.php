<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tanda Terima Faktur</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 10px;
            color: #000;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
        }
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 10px;
        }
        .customer-info {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
        }
        .customer-info h2 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .customer-info p {
            font-size: 10px;
            margin: 3px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table th {
            background-color: #333;
            color: #fff;
            padding: 8px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
        }
        table th.text-right {
            text-align: right;
        }
        table td {
            padding: 6px 8px;
            border-bottom: 1px solid #ddd;
            font-size: 9px;
        }
        table td.text-right {
            text-align: right;
        }
        table tr:last-child td {
            border-bottom: none;
        }
        .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
        }
        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 10px;
        }
        .summary-row.total {
            font-weight: bold;
            font-size: 12px;
            border-top: 2px solid #000;
            padding-top: 8px;
            margin-top: 5px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 9px;
            color: #666;
        }
        .page-break {
            page-break-after: always;
        }
        .overdue {
            color: #d32f2f;
            font-weight: bold;
        }
    </style>
</head>
<body>
    @foreach($receipts as $index => $receipt)
        <div class="header">
            <h1>TANDA TERIMA FAKTUR</h1>
            <p>Tanggal Cetak: {{ $print_date }}</p>
        </div>

        <div class="customer-info">
            <h2>Kepada:</h2>
            <p><strong>{{ $receipt['customer']['name'] }}</strong></p>
            @if($receipt['customer']['address'])
                <p>{{ $receipt['customer']['address'] }}</p>
            @endif
            @if($receipt['customer']['phone_number'])
                <p>Telp: {{ $receipt['customer']['phone_number'] }}</p>
            @endif
        </div>

        <p style="margin-bottom: 10px; font-size: 11px;">
            Dengan hormat, kami sampaikan daftar faktur yang belum lunas untuk segera dilakukan pembayaran:
        </p>

        <table>
            <thead>
                <tr>
                    <th>No. Faktur</th>
                    <th>Tanggal</th>
                    <th>Jatuh Tempo</th>
                    <th class="text-right">Total</th>
                    <th class="text-right">Terbayar</th>
                    <th class="text-right">Sisa</th>
                </tr>
            </thead>
            <tbody>
                @foreach($receipt['invoices'] as $invoice)
                    <tr>
                        <td class="font-mono">{{ $invoice['sale_number'] }}</td>
                        <td>{{ $invoice['sale_date'] }}</td>
                        <td class="{{ $invoice['is_overdue'] ? 'overdue' : '' }}">
                            {{ $invoice['due_date'] }}
                            @if($invoice['is_overdue'])
                                <span style="color: #d32f2f;">(Jatuh Tempo)</span>
                            @endif
                        </td>
                        <td class="text-right">{{ number_format($invoice['total_amount'], 0, ',', '.') }}</td>
                        <td class="text-right">{{ number_format($invoice['total_paid'], 0, ',', '.') }}</td>
                        <td class="text-right"><strong>{{ number_format($invoice['remaining_amount'], 0, ',', '.') }}</strong></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row">
                <span>Jumlah Faktur:</span>
                <span><strong>{{ $receipt['summary']['total_invoices'] }}</strong></span>
            </div>
            <div class="summary-row">
                <span>Total Faktur:</span>
                <span>{{ number_format($receipt['summary']['total_amount'], 0, ',', '.') }}</span>
            </div>
            <div class="summary-row">
                <span>Total Terbayar:</span>
                <span>{{ number_format($receipt['summary']['total_paid'], 0, ',', '.') }}</span>
            </div>
            <div class="summary-row total">
                <span>SISA TAGIHAN:</span>
                <span>{{ number_format($receipt['summary']['total_remaining'], 0, ',', '.') }}</span>
            </div>
        </div>

        <div class="footer">
            <p>Terima kasih atas perhatian dan kerjasamanya.</p>
            <p style="margin-top: 20px;">Hormat kami,</p>
            <p style="margin-top: 40px;">_________________________</p>
        </div>

        @if($index < count($receipts) - 1)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>

