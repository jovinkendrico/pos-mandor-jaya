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
            <th>Qty Terjual</th>
            <th>Rasio Perputaran</th>
            <th>Hari Perputaran</th>
            <th>Kategori</th>
        </tr>
    </thead>
    <tbody>
        @foreach($turnoverData as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['item_code'] }}</td>
            <td>{{ $item['item_name'] }}</td>
            <td class="text-right">{{ number_format($item['stock'], 2, ',', '.') }}</td>
            <td>{{ $item['unit'] }}</td>
            <td class="text-right">{{ number_format($item['total_sales'], 2, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['turnover_ratio'], 2, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['days_to_turnover'], 0, ',', '.') }} hari</td>
            <td class="text-center">
                @if($item['turnover_category'] === 'fast')
                    Cepat
                @elseif($item['turnover_category'] === 'medium')
                    Sedang
                @else
                    Lambat
                @endif
            </td>
        </tr>
        @endforeach
    </tbody>
</table>
@endsection

