@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Kode</th>
            <th>Nama Item</th>
            <th>Qty Terjual</th>
            <th>Jml Transaksi</th>
            <th>Total Revenue</th>
            <th>Total Cost</th>
            <th>Total Profit</th>
            <th>Margin (%)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($itemSales as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['total_quantity'], 2, ',', '.') }}</td>
            <td class="text-center">{{ $item['transaction_count'] }}</td>
            <td class="text-right">{{ number_format($item['total_revenue'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['total_cost'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['total_profit'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['profit_margin'], 2, ',', '.') }}%</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="3" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['total_quantity'], 2, ',', '.') }}</td>
            <td></td>
            <td class="text-right">{{ number_format($summary['total_revenue'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_cost'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_profit'], 0, ',', '.') }}</td>
            <td></td>
        </tr>
    </tbody>
</table>
@endsection

