@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Invoice</th>
            <th>Customer</th>
            <th>Total Sebelum Diskon</th>
            <th>Diskon</th>
            <th>PPN</th>
            <th>Total</th>
            <th>Profit</th>
        </tr>
    </thead>
    <tbody>
        @foreach($sales as $index => $sale)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ \Carbon\Carbon::parse($sale->sale_date)->format('d/m/Y') }}</td>
            <td>{{ $sale->sale_number }}</td>
            <td>{{ $sale->customer ? $sale->customer->name : 'No Customer' }}</td>
            <td class="text-right">{{ number_format($sale->subtotal, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($sale->discount1_amount + $sale->discount2_amount, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($sale->ppn_amount, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($sale->total_amount, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($sale->total_profit, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="4" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['total_subtotal'] ?? $summary['total_sales'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_discount'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_ppn'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_amount'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_profit'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection

