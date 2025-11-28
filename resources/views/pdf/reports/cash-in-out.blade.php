@extends('pdf.reports.base')

@section('content')
<h3 style="margin-top: 15px; margin-bottom: 10px;">Kas Masuk</h3>
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Transaksi</th>
            <th>Bank</th>
            <th>Akun</th>
            <th>Jumlah</th>
        </tr>
    </thead>
    <tbody>
        @foreach($cashIns as $index => $cashIn)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ \Carbon\Carbon::parse($cashIn->cash_in_date)->format('d/m/Y') }}</td>
            <td>{{ $cashIn->cash_in_number }}</td>
            <td>{{ $cashIn->bank->name ?? '-' }}</td>
            <td>{{ $cashIn->chartOfAccount->code ?? '-' }} - {{ $cashIn->chartOfAccount->name ?? '-' }}</td>
            <td class="text-right">{{ number_format($cashIn->amount, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="5" class="text-right">TOTAL KAS MASUK</td>
            <td class="text-right">{{ number_format($summary['total_cash_in_amount'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>

<h3 style="margin-top: 20px; margin-bottom: 10px;">Kas Keluar</h3>
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Transaksi</th>
            <th>Bank</th>
            <th>Akun</th>
            <th>Jumlah</th>
        </tr>
    </thead>
    <tbody>
        @foreach($cashOuts as $index => $cashOut)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ \Carbon\Carbon::parse($cashOut->cash_out_date)->format('d/m/Y') }}</td>
            <td>{{ $cashOut->cash_out_number }}</td>
            <td>{{ $cashOut->bank->name ?? '-' }}</td>
            <td>{{ $cashOut->chartOfAccount->code ?? '-' }} - {{ $cashOut->chartOfAccount->name ?? '-' }}</td>
            <td class="text-right">{{ number_format($cashOut->amount, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="5" class="text-right">TOTAL KAS KELUAR</td>
            <td class="text-right">{{ number_format($summary['total_cash_out_amount'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>

<div style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
    <strong>Net Cash Flow: {{ number_format($summary['net_cash_flow'], 0, ',', '.') }}</strong>
</div>
@endsection

