<!DOCTYPE html>
<html>
<head>
    <title>Laporan Binder</title>
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: sans-serif; font-size: 11px; }
        .page-break { page-break-after: always; }
        .page-break:last-child { page-break-after: auto; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; vertical-align: top; }
        th { background-color: #f0f0f0; text-align: center; }
        
        .header { margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        
        .sale-wrapper { margin-bottom: 15px; break-inside: avoid; }
    </style>
</head>
<body>
    <div class="header">
        <table style="border: none; margin-bottom: 0;">
            <tr style="border: none;">
                <td style="border: none; width: 70%;">
                    <h2 style="margin: 0;">LAPORAN BINDER</h2>
                    <p style="margin: 0;">Mandor Jaya</p>
                </td>
                <td style="border: none; text-align: right;">
                    <p style="margin: 0;">Periode:
                        {{ $date_from ? \Carbon\Carbon::parse($date_from)->format('d/m/Y') : 'Awal' }}
                        -
                        {{ $date_to ? \Carbon\Carbon::parse($date_to)->format('d/m/Y') : 'Akhir' }}
                    </p>
                    <p style="margin: 0; font-size: 9px;">Dicetak: {{ now()->format('d/m/Y H:i') }}</p>
                </td>
            </tr>
        </table>
    </div>

    @foreach ($sales as $sale)
        <div class="sale-wrapper">
            <!-- Sale Header Line -->
            <div
                style="background-color: #ddd; padding: 5px; border: 1px solid #000; border-bottom: none; font-weight: bold;">
                NO: {{ $sale->sale_number }} |
                TGL: {{ $sale->sale_date->format('d/m/Y') }} |
                CUST: {{ $sale->customer->name ?? 'UMUM' }} |
                CREATED: {{ $sale->creator->name ?? 'System' }}
                @if ($sale->status === 'pending')
                    <span style="color: red; float: right;">(BELUM KONFIRMASI)</span>
                @endif
            </div>

            <table style="width: 100%; margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="width: 35%;">Nama Barang</th>
                        <th style="width: 10%;">Stok Dijual</th>
                        <th style="width: 12%;">Harga Beli</th>
                        <th style="width: 15%;">Total Beli</th>
                        <th style="width: 12%;">Harga Jual</th>
                        <th style="width: 15%;">Total Jual</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($sale->details as $detail)
                        @php
                            $isPending = $sale->status === 'pending';
                            $qty = $detail->quantity ?: 1;
                            $unitCost = $isPending ? 0 : $detail->cost / $qty;
                            $totalCost = $isPending ? 0 : $detail->cost;
                        @endphp
                        <tr>
                            <td>{{ $detail->item->name ?? '-' }}</td>
                            <td class="text-center">{{ number_format($detail->quantity, 0, ',', '.') }}
                                {{ $detail->itemUom->uom->name ?? '' }}</td>
                            <!-- Harga Beli (Unit Cost) -->
                            <td class="text-right">{{ number_format($unitCost, 2, ',', '.') }}</td>
                            <!-- Total Harga Beli (Total Cost) -->
                            <td class="text-right">{{ number_format($totalCost, 2, ',', '.') }}</td>
                            <!-- Harga Jual (Unit Price) -->
                            <td class="text-right">{{ number_format($detail->price, 2, ',', '.') }}</td>
                            <!-- Total Harga Jual (Subtotal) -->
                            <td class="text-right">{{ number_format($detail->subtotal, 2, ',', '.') }}</td>
                        </tr>
                    @endforeach
                    <!-- Summary per Sale -->
                    <tr style="background-color: #f9f9f9; font-weight: bold;">
                        <td colspan="3" class="text-right">TOTAL TRANSAKSI INI:</td>
                        <td class="text-right">
                            {{ number_format($sale->status === 'pending' ? 0 : $sale->details->sum('cost'), 2, ',', '.') }}
                        </td>
                        <td></td>
                        <td class="text-right">{{ number_format($sale->details->sum('subtotal'), 2, ',', '.') }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach
</body>
</html>
