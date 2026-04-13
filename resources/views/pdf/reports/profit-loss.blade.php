@extends('pdf.reports.base')

@section('page-style')
<style>
    @page {
        size: A4 portrait;
        margin: 1cm;
    }
</style>
@endsection

@section('content')
<div style="margin-bottom: 20px;">
    <table>
        <tr>
            <td style="width: 120px; font-weight: bold; border: none; padding: 2px;">Laporan</td>
            <td style="border: none; padding: 2px;">: Laba Rugi</td>
        </tr>
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Periode</td>
            <td style="border: none; padding: 2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}</td>
        </tr>
    </table>
</div>

<h3 style="margin-top: 20px;">PENDAPATAN</h3>
<table>
    <thead>
        <tr>
            <th style="width: 20%;">Kode Akun</th>
            <th style="width: 60%;">Nama Akun</th>
            <th style="width: 20%; text-align: right;">Jumlah</th>
        </tr>
    </thead>
    <tbody>
        @foreach($incomeDetails as $item)
        <tr>
            <td style="text-align: center;">{{ $item['code'] }}</td>
            <td>{{ $item['name'] }}</td>
            <td style="text-align: right;">{{ number_format($item['amount'], 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td colspan="2" style="text-align: right;">TOTAL PENDAPATAN</td>
            <td style="text-align: right;">{{ number_format($totalIncome, 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>

<h3 style="margin-top: 20px;">HARGA POKOK PENJUALAN (HPP)</h3>
<table>
    <tbody>
        <tr style="background-color: #f9f9f9; font-weight: bold;">
            <td style="width: 80%; text-align: right;">TOTAL HPP</td>
            <td style="width: 20%; text-align: right;">{{ number_format($totalHPP, 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>

<div style="margin-top: 10px; padding: 10px; background-color: #eee; font-weight: bold; text-align: right;">
    LABA KOTOR: {{ number_format($grossProfit, 0, ',', '.') }}
</div>

<h3 style="margin-top: 20px;">BIAYA - BIAYA</h3>
@if(count($expenseByBank) > 0)
    @foreach($expenseByBank as $group)
    <p style="margin: 10px 0 4px; font-weight: bold; font-size: 0.9em; color: #555;">{{ strtoupper($group['bank_name']) }}</p>
    <table>
        <thead>
            <tr>
                <th style="width: 20%;">Kode Akun</th>
                <th style="width: 60%;">Nama Akun</th>
                <th style="width: 20%; text-align: right;">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @foreach($group['details'] as $item)
            <tr>
                <td style="text-align: center;">{{ $item['code'] }}</td>
                <td>{{ $item['name'] }}</td>
                <td style="text-align: right;">{{ number_format($item['amount'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
            <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td colspan="2" style="text-align: right;">TOTAL {{ strtoupper($group['bank_name']) }}</td>
                <td style="text-align: right;">{{ number_format($group['total'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
    @endforeach
    <div style="margin-top: 8px; padding: 8px; background-color: #ddd; font-weight: bold; text-align: right;">
        TOTAL BIAYA: {{ number_format($totalExpense, 0, ',', '.') }}
    </div>
@else
    <table>
        <thead>
            <tr>
                <th style="width: 20%;">Kode Akun</th>
                <th style="width: 60%;">Nama Akun</th>
                <th style="width: 20%; text-align: right;">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expenseDetails as $item)
            <tr>
                <td style="text-align: center;">{{ $item['code'] }}</td>
                <td>{{ $item['name'] }}</td>
                <td style="text-align: right;">{{ number_format($item['amount'], 0, ',', '.') }}</td>
            </tr>
            @endforeach
            <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td colspan="2" style="text-align: right;">TOTAL BIAYA</td>
                <td style="text-align: right;">{{ number_format($totalExpense, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
@endif

<div style="margin-top: 20px; padding: 15px; background-color: #333; color: white; font-weight: bold; text-align: right; font-size: 1.2em;">
    LABA (RUGI) BERSIH: {{ number_format($netProfit, 0, ',', '.') }}
</div>
@endsection
