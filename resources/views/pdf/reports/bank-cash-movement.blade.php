@extends('pdf.reports.base')

@section('content')
<div style="margin-bottom: 20px;">
    <table>
        <tr>
            <td style="width: 120px; font-weight: bold; border: none; padding: 2px;">Bank / Kas</td>
            <td style="border: none; padding: 2px;">: {{ $bank->name }} {{ $bank->account_number ? '('.$bank->account_number.')' : '' }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Periode</td>
            <td style="border: none; padding: 2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}</td>
        </tr>
    </table>
</div>

<table>
    <thead>
        <tr>
            <th style="width: 10%;">Tanggal</th>
            <th style="width: 15%;">No. Referensi</th>
            <th style="width: 30%;">Keterangan</th>
            <th style="width: 15%; text-align: right;">Debit (Masuk)</th>
            <th style="width: 15%; text-align: right;">Kredit (Keluar)</th>
            <th style="width: 15%; text-align: right;">Saldo</th>
        </tr>
    </thead>
    <tbody>
        <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td colspan="5" style="text-align: right;">SALDO AWAL</td>
            <td style="text-align: right;">{{ number_format($openingBalance, 0, ',', '.') }}</td>
        </tr>
        
        @if(count($transactions) === 0)
        <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">Tidak ada pergerakan kas pada periode ini.</td>
        </tr>
        @else
            @foreach($transactions as $t)
            <tr>
                <td style="text-align: center;">{{ $t['date'] }}</td>
                <td style="text-align: center;">{{ $t['reference'] }}</td>
                <td>{{ $t['description'] }}</td>
                <td style="text-align: right;">{{ $t['debit'] > 0 ? number_format($t['debit'], 0, ',', '.') : '-' }}</td>
                <td style="text-align: right;">{{ $t['credit'] > 0 ? number_format($t['credit'], 0, ',', '.') : '-' }}</td>
                <td style="text-align: right;">{{ number_format($t['balance'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
        @endif

        <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td colspan="5" style="text-align: right;">SALDO AKHIR</td>
            <td style="text-align: right;">{{ number_format($closingBalance, 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>

@endsection
