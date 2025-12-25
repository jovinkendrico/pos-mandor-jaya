@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Invoice</th>
            <th>Supplier</th>
            <th>Total Sebelum Diskon</th>
            <th>Diskon</th>
            <th>PPN</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($purchases as $index => $purchase)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ \Carbon\Carbon::parse($purchase->purchase_date)->format('d/m/Y') }}</td>
            <td>{{ $purchase->purchase_number }}</td>
            <td>{{ $purchase->supplier ? $purchase->supplier->name : 'No Supplier' }}</td>
            <td class="text-right">{{ number_format($purchase->subtotal, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($purchase->discount1_amount + $purchase->discount2_amount, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($purchase->ppn_amount, 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($purchase->total_amount, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="4" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['total_subtotal'] ?? $summary['total_purchases'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_discount'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_ppn'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_amount'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection

