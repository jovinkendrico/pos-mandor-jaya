@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Bank</th>
            <th>Tipe</th>
            <th>Saldo Awal</th>
            <th>Kas Masuk</th>
            <th>Kas Keluar</th>
            <th>Net Flow</th>
            <th>Saldo Akhir</th>
        </tr>
    </thead>
    <tbody>
        @foreach($bankCashFlow as $index => $bank)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ $bank['bank_name'] }}</td>
            <td>{{ $bank['bank_type'] }}</td>
            <td class="text-right">{{ number_format($bank['opening_balance'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($bank['cash_in'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($bank['cash_out'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($bank['net_cash_flow'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($bank['closing_balance'], 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="3" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['total_opening_balance'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_cash_in'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_cash_out'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_net_flow'], 0, ',', '.') }}</td>
            <td class="text-right">{{ number_format($summary['total_closing_balance'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection

