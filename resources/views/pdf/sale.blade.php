<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        @page {
            size: 24cm 14cm;
            margin: 0;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Courier New", Courier, monospace;
            font-size: 16px;
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
            margin-bottom: 3px;
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
        }

        .info-value {
            display: inline-block;
            font-weight: normal;
        }

        .total {
            font-weight: normal;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            border: 1px dashed #000;
        }

        table th,
        table td {
            border: none; 
            padding: 2px;
            text-align: left;
            font-weight: normal;
        }

        table th {
            background-color: #f0f0f0;
            border-bottom:1px dashed #000;
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
            margin-top: 1px;
            padding-top: 10px;
        }

        .summary-section {
            margin-top: 3px;
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
        }

        .signature-section {
            margin-top: 10px;
            width: 100%;
        }

        .signature-table {
            width: 100%;
            border-collapse: collapse;
            margin-left: auto;
            max-width: 600px;
            border: none;
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
            font-size: 14px;
        }
    </style>
</head>
<body>
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
                <div class="info-value">{{ $sale->customer->city->name ?? '-' }}</div>
            </div>
            <div class="info-row">
                <div class="info-value">{{ $sale->customer->phone_number ?? '-' }}</div>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 5%; border-right: 1px dashed #000;">No.</th>
                <th style="width: 10%; border-right: 1px dashed #000;">Quantity</th>
                <th style="width: 40%; border-right: 1px dashed #000;">Nama Barang</th>
                <th style="width: 15%;border-right: 1px dashed #000;">Harga @</th>
                {{-- <th style="width: 10%;">Diskon 1 %</th>
                <th style="width: 10%;">Diskon 2 %</th> --}}
                <th style="width: 20%;">Jumlah</th>
            </tr>
        </thead>
        <tbody>
             @php
                $maxRows = 12;
                $detailsCount = count($sale->details);
             @endphp

             @foreach($sale->details as $index => $detail)
             <tr>
                <td class="text-center" style="border-right: 1px dashed #000;">{{ $index + 1 }}</td>
                <td class="text-center" style="border-right: 1px dashed #000;">{{ fmod($detail->quantity, 1) == 0 ? number_format($detail->quantity, 0, ',', '.') : number_format($detail->quantity, 2, ',', '.') }} {{ $detail->itemUom->uom->name ?? '-' }}</td>
                <td style="border-right: 1px dashed #000;">{{ $detail->item->name ?? '-' }}</td>
                <td class="text-right" style="border-right: 1px dashed #000;">{{ number_format($detail->price, 0, ',', '.') }}</td>
                <td class="text-right" style="border-right: 1px dashed #000;">{{ number_format($detail->subtotal, 0, ',', '.') }}</td>
             </tr>
             @endforeach

             @for($i = $detailsCount; $i < $maxRows; $i++)
             <tr>
                <td class="text-center" style="border-right: 1px dashed #000;">{{ $i + 1 }}</td>
                <td style="border-right: 1px dashed #000;">&nbsp;</td>
                <td style="border-right: 1px dashed #000;">&nbsp;</td>
                <td style="border-right: 1px dashed #000;">&nbsp;</td>
                <td style="border-right: 1px dashed #000; border-left: none;">&nbsp;</td>
             </tr>
             @endfor

             <tr>
                <td colspan="3" class="text-left" style="border-top: 1px dashed #000;">Terbilang : <i style="text-transform: capitalize;">
                    {{ Terbilang::make($sale->total_amount) }} Rupiah
                </i>
                </td>
                <td style="border-top: 1px dashed #000;">
                    Total: 
                </td>
                <td style="border-left: none; border-top: 1px dashed #000;" class="text-right total">Rp. {{ number_format($sale->total_amount, 0, ',', '.') }}</td>
             </tr>
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

