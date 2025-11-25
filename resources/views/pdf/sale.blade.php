<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        @page {
            size: 21cm 14.85cm;
            margin: 0.5cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            padding: 10px;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .info-section {
            margin-bottom: 12px;
        }

        .info-row {
            display: flex;
            margin-bottom: 5px;
        }

        .info-label {
            width: 120px;
            font-weight: bold;
        }

        .info-value {
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 10px;
        }

        table th,
        table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: left;
        }

        table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        table td {
            text-align: left;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .footer {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #000;
        }

        .summary-section {
            margin-top: 10px;
            width: 100%;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-left: auto;
            max-width: 400px;
        }

        .summary-table td {
            padding: 3px 5px;
            text-align: right;
        }

        .summary-table td:first-child {
            text-align: left;
            font-weight: bold;
        }

        .signature-section {
            margin-top: 30px;
            width: 100%;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-left: auto;
            max-width: 600px;
        }

        .signature-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: bottom;
            padding: 0 15px;
        }

        .signature-box {
            display: inline-block;
            width: 100%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
            width: 100%;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SALES ORDER</h1>
    </div>

    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Tanggal:</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($sale->sale_date)->format('d-m-Y') }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">No. SO:</div>
            <div class="info-value">{{ $sale->sale_number }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Customer:</div>
            <div class="info-value">{{ $sale->customer->name ?? '-' }}</div>
        </div>
        @if($sale->customer && $sale->customer->address)
        <div class="info-row">
            <div class="info-label">Alamat:</div>
            <div class="info-value">{{ $sale->customer->address }}</div>
        </div>
        @endif
        @if($sale->due_date)
        <div class="info-row">
            <div class="info-label">Jatuh Tempo:</div>
            <div class="info-value">{{ \Carbon\Carbon::parse($sale->due_date)->format('d-m-Y') }}</div>
        </div>
        @endif
        @if($sale->notes)
        <div class="info-row">
            <div class="info-label">Catatan:</div>
            <div class="info-value">{{ $sale->notes }}</div>
        </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">No.</th>
                <th style="width: 15%;">Kode</th>
                <th style="width: 30%;">Nama Barang</th>
                <th style="width: 8%;" class="text-center">Qty</th>
                <th style="width: 10%;">Satuan</th>
                <th style="width: 12%;" class="text-right">@ Harga</th>
                <th style="width: 10%;" class="text-right">Diskon 1</th>
                <th style="width: 10%;" class="text-right">Diskon 2</th>
                <th style="width: 10%;" class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @if($sale->details && count($sale->details) > 0)
                @foreach($sale->details as $index => $detail)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>{{ $detail->item->code ?? '-' }}</td>
                    <td>{{ $detail->item->name ?? '-' }}</td>
                    <td class="text-center">{{ number_format($detail->quantity, 2, ',', '.') }}</td>
                    <td>{{ $detail->itemUom->uom->name ?? '-' }}</td>
                    <td class="text-right">{{ number_format($detail->price, 0, ',', '.') }}</td>
                    <td class="text-right">
                        @if($detail->discount1_percent > 0)
                            {{ number_format($detail->discount1_percent, 2, ',', '.') }}%
                        @else
                            -
                        @endif
                    </td>
                    <td class="text-right">
                        @if($detail->discount2_percent > 0)
                            {{ number_format($detail->discount2_percent, 2, ',', '.') }}%
                        @else
                            -
                        @endif
                    </td>
                    <td class="text-right">{{ number_format($detail->subtotal, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            @else
            <tr>
                <td colspan="9" class="text-center">No items found</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        <div class="summary-section">
            <table class="summary-table">
                <tr>
                    <td>Subtotal:</td>
                    <td>{{ number_format($sale->subtotal, 0, ',', '.') }}</td>
                </tr>
                @if($sale->discount1_amount > 0)
                <tr>
                    <td>Diskon 1 ({{ number_format($sale->discount1_percent, 2, ',', '.') }}%):</td>
                    <td>{{ number_format($sale->discount1_amount, 0, ',', '.') }}</td>
                </tr>
                @endif
                @if($sale->discount2_amount > 0)
                <tr>
                    <td>Diskon 2 ({{ number_format($sale->discount2_percent, 2, ',', '.') }}%):</td>
                    <td>{{ number_format($sale->discount2_amount, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr>
                    <td>Total Setelah Diskon:</td>
                    <td>{{ number_format($sale->total_after_discount, 0, ',', '.') }}</td>
                </tr>
                @if($sale->ppn_amount > 0)
                <tr>
                    <td>PPN ({{ number_format($sale->ppn_percent, 2, ',', '.') }}%):</td>
                    <td>{{ number_format($sale->ppn_amount, 0, ',', '.') }}</td>
                </tr>
                @endif
                <tr style="border-top: 2px solid #000; font-weight: bold;">
                    <td>Total:</td>
                    <td>{{ number_format($sale->total_amount, 0, ',', '.') }}</td>
                </tr>
                @if($sale->status === 'confirmed' && $sale->total_cost > 0)
                <tr>
                    <td>HPP:</td>
                    <td>{{ number_format($sale->total_cost, 0, ',', '.') }}</td>
                </tr>
                <tr>
                    <td>Profit:</td>
                    <td>{{ number_format($sale->total_profit, 0, ',', '.') }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Dibuat Oleh</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Disetujui Oleh</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Customer</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>

