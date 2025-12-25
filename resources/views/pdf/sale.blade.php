<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        @page {
            size: 21cm 14.85cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            padding-top: 32px;
            padding-left: 32px;
            padding-right: 32px;
            padding-bottom: 8px;
        }

        .header {
            text-align: center;
            margin-bottom: 32px;
            border-bottom: 2px solid #000;
            padding-bottom: 2px;
        }

        .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header-wrapper {
            display: block;
        }

        .info-section {
            display: inline-block;
            width: 350px;
            margin-bottom: 12px;
        }

        .info-row {
            display: block;
            margin-bottom: 5px;
        }

        .info-label {
            display: inline-block;
            width: 120px;
            font-weight: bold;
        }

        .info-value {
            display: inline-block;
            font-weight: normal;
        }

        .total {
            font-weight: bold;
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
            padding: 2px;
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
        <h1>INVOICE PENJUALAN</h1>
    </div>

    <div class="header-wrapper">
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">No. Faktur</span>
                <span class="info-value">: {{ $sale->sale_number }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tanggal</span>
                <span class="info-value">: {{ \Carbon\Carbon::parse($sale->sale_date)->format('d-m-Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Jatuh Tempo</span>
                <span class="info-value">: {{ \Carbon\Carbon::parse($sale->due_date)->format('d-m-Y') }}</span>
            </div>
            
        </div>
        <div class="info-section">
            <div class="info-row">
                <span class="info-label">Kepada Yth.</span>
            </div>
            <div class="info-row">
                <div class="info-value">{{ $sale->customer->name ?? '-' }}</div>
            </div>
            <div class="info-row">
                <div class="info-value">{{ $sale->customer->address ?? '-' }}</div>
            </div>
            <div class="info-row">
                <div class="info-value">{{ $sale->customer->address ?? '-' }}</div>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%;">No.</th>
                <th style="width: 20%;">Quantity</th>
                <th style="width: 30%;">Nama Barang</th>
                <th style="width: 15%">Harga @</th>
                {{-- <th style="width: 10%;">Diskon 1 %</th>
                <th style="width: 10%;">Diskon 2 %</th> --}}
                <th style="width: 20%;">Jumlah</th>
            </tr>
        </thead>
        <tbody>
             @if($sale->details && count($sale->details) > 0)
                @foreach($sale->details as $index => $detail)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td class="text-center">{{ number_format($detail->quantity, 2, ',', '.') }} {{ $detail->itemUom->uom->name ?? '-' }}</td>
                    <td>{{ $detail->item->name ?? '-' }}</td>
                    <td class="text-right">{{ number_format($detail->price, 0, ',', '.') }}</td>
                    {{-- <td class="text-right">
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
                    </td> --}}
                    <td class="text-right">{{ number_format($detail->subtotal, 0, ',', '.') }}</td>
                </tr>
                @endforeach
                <tr>
                    <td colspan="3" class="text-left">Terbilang : <i style="text-transform: capitalize; font-weight: bold;">
                        {{ Terbilang::make($sale->total_amount) }} Rupiah
                    </i>
                    </td>
                    <td style="border-right: none;">
                        Total: 
                    </td>
                    <td style="border-left: none;" class="text-right total">Rp. {{ number_format($sale->total_amount, 0, ',', '.') }}</td>
                </tr>
            @else
            <tr>
                <td colspan="9" class="text-center">No items found</td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Tanda Terima</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Dikeluarkan</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Diperiksa</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="signature-box">
                            <div class="signature-line">
                                <div>Supir</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>

