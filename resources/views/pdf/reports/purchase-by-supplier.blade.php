@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Supplier</th>
            <th>Jml Transaksi</th>
            <th>Subtotal</th>
            <th>Diskon</th>
            <th>PPN</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($supplierPurchases as $index => $supplier)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $supplier['supplier_name'] }}</td>
            <td class="text-center">{{ $supplier['transaction_count'] }}</td>
            <td class="text-right">{{ number_format($supplier['total_subtotal'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($supplier['total_discount'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($supplier['total_ppn'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($supplier['total_purchases'], 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="2" class="text-right">TOTAL</td>
            <td class="text-center">{{ $summary['total_transactions'] }}</td>
            <td class="text-right">{{ number_format($summary['total_subtotal'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_discount'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_ppn'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_purchases'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection


