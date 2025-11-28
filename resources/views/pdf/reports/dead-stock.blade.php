@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Kode</th>
            <th>Nama Item</th>
            <th>Stok</th>
            <th>Satuan</th>
            <th>Hari Tanpa Penjualan</th>
            <th>Nilai Stok</th>
        </tr>
    </thead>
    <tbody>
        @foreach($deadStockItems as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['stock'], 2, ',', '.') }}</td>
            <td>{{ $item['unit'] }}</td>
            <td class="text-center">{{ $item['days_without_sale'] }} hari</td>
            <td class="text-right">{{ number_format($item['stock_value'] ?? 0, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="6" class="text-right">TOTAL NILAI STOK</td>
            <td class="text-right">{{ number_format($summary['total_stock_value'] ?? 0, 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection

