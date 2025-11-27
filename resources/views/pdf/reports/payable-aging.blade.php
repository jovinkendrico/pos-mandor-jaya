@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>No. Invoice</th>
            <th>Supplier</th>
            <th>Jatuh Tempo</th>
            <th>Saldo</th>
            <th>0-30 Hari</th>
            <th>31-60 Hari</th>
            <th>61-90 Hari</th>
            <th>{'>'} 90 Hari</th>
        </tr>
    </thead>
    <tbody>
        @foreach($agingData as $index => $item)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $item['purchase_number'] }}</td>
            <td>{{ $item['supplier_name'] }}</td>
            <td>{{ \Carbon\Carbon::parse($item['due_date'])->format('d/m/Y') }}</td>
            <td class="text-right">{{ number_format($item['remaining_amount'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['age_0_30'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['age_31_60'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['age_61_90'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($item['age_over_90'], 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="4" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['grand_total'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_0_30'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_31_60'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_61_90'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_over_90'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection

