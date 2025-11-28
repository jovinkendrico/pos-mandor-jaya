@extends('pdf.reports.base')

@section('content')
<table>
    <thead>
        <tr>
            <th>No</th>
            <th>Tanggal</th>
            <th>No. Pembayaran</th>
            <th>Bank</th>
            <th>Metode</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($salePayments as $index => $payment)
        <tr>
            <td class="text-center">{{ $index + 1 }}</td>
            <td>{{ \Carbon\Carbon::parse($payment->payment_date)->format('d/m/Y') }}</td>
            <td>{{ $payment->payment_number }}</td>
            <td>{{ $payment->bank->name ?? '-' }}</td>
            <td>{{ $payment->payment_method }}</td>
            <td class="text-right">{{ number_format($payment->total_amount, 0, ',', '.') }}</td>
        </tr>
        @endforeach
        <tr style="font-weight: bold; background-color: #e0e0e0;">
            <td colspan="5" class="text-right">TOTAL</td>
            <td class="text-right">{{ number_format($summary['total_amount'], 0, ',', '.') }}</td>
        </tr>
    </tbody>
</table>
@endsection


