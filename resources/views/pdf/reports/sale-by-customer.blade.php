@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Customer</th>
            <th>Jml Transaksi</th>
            <th>Total Penjualan</th>
            <th>Total Cost</th>
            <th>Total Profit</th>
            <th>Margin (%)</th>
        </tr>
    </thead>
    <tbody>
        @foreach($customerSales as $index => $customer)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $customer['customer_name'] }}</td>
            <td class="text-center">{{ $customer['transaction_count'] }}</td>
            <td class="text-right">{{ number_format($customer['total_sales'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($customer['total_cost'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($customer['total_profit'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($customer['profit_margin'], 2, ',', '.') }}%</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="2" class="text-right">TOTAL</td>
            <td class="text-center">{{ $summary['total_transactions'] }}</td>
            <td class="text-right">{{ number_format($summary['total_sales'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_cost'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_profit'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['profit_margin'], 2, ',', '.') }}%</td>
        </tr>
    </tbody>
</table>
@endsection

