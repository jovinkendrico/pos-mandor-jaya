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
            <th>Harga Rata-rata</th>
            <th>Nilai Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($valuationData as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['stock'], 2, ',', '.') }}</td>
            <td>{{ $item['unit'] }}</td>
            <td class="text-right">{{ number_format($item['avg_cost'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['total_value'], 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="6" class="text-right">TOTAL NILAI PERSEDIAAN</td>
            <td class="text-right">{{ number_format($summary['total_value'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection

