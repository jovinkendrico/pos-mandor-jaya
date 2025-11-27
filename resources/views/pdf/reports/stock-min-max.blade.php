@extends('pdf.reports.base')

@section('content')
@if(count($lowStockItems) > 0)
<h3 style="margin-top: 15px; margin-bottom: 10px;">Stok Rendah (≤ {{ number_format($summary['min_stock_threshold'], 0, ',', '.') }})</h3>
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Kode</th>
            <th>Nama Item</th>
            <th>Stok</th>
            <th>Satuan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($lowStockItems as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['stock'], 2, ',', '.') }}</td>
            <td>{{ $item['unit'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($highStockItems) > 0)
<h3 style="margin-top: 20px; margin-bottom: 10px;">Stok Tinggi (≥ {{ number_format($summary['max_stock_threshold'], 0, ',', '.') }})</h3>
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Kode</th>
            <th>Nama Item</th>
            <th>Stok</th>
            <th>Satuan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($highStockItems as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['stock'], 2, ',', '.') }}</td>
            <td>{{ $item['unit'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

@if(count($zeroStockItems) > 0)
<h3 style="margin-top: 20px; margin-bottom: 10px;">Stok Habis</h3>
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Kode</th>
            <th>Nama Item</th>
            <th>Stok</th>
            <th>Satuan</th>
        </tr>
    </thead>
    <tbody>
        @foreach($zeroStockItems as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['stock'], 2, ',', '.') }}</td>
            <td>{{ $item['unit'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif
@endsection


