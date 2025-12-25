@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Retur</th>
            <th>No. Invoice</th>
            <th>Supplier</th>
            <th>Tipe</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($purchaseReturns as $index => $return)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ \Carbon\Carbon::parse($return->return_date)->format('d/m/Y') }}</td>
            <td>{{ $return->return_number }}</td>
            <td>{{ $return->purchase->purchase_number ?? '-' }}</td>
            <td>{{ $return->purchase->supplier->name ?? 'No Supplier' }}</td>
            <td>{{ $return->return_type }}</td>
            <td class="text-right">{{ number_format($return->total_amount, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="6" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['total_amount'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection


