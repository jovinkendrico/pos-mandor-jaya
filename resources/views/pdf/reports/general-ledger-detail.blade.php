@extends('pdf.reports.base')

@section('content')
<div style="margin-bottom: 20px;">
    <table>
        <tr>
            <td style="width: 120px; font-weight: bold; border: none; padding: 2px;">Akun</td>
            <td style="border: none; padding: 2px;">: {{ $account->code }} - {{ $account->name }}</td>
        </tr>
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Periode</td>
            <td style="border: none; padding: 2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}</td>
        </tr>
    </table>
</div>

@php
    $displays = count($groupedLedgerData) > 0 ? $groupedLedgerData : [$ledgerData];
    
    // Group by bank
    $bankGroups = [];
    foreach($displays as $data) {
        $bankName = isset($data['bank']) ? $data['bank']->name : 'Tanpa Kas';
        $bankGroups[$bankName][] = $data;
    }
@endphp

@foreach($bankGroups as $bankName => $vehicleData)
    <div style="margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 5px; background-color: #f0f0f0; padding: 5px;">
        <h3 style="margin: 0; color: #333; text-transform: uppercase;">{{ $bankName }}</h3>
    </div>

    @foreach($vehicleData as $data)
        <div style="margin-top: 15px; margin-left: 20px;">
            @if(isset($data['vehicle']) && $data['vehicle']->police_number !== 'None')
                <h4 style="margin-bottom: 5px; color: #555;">Divisi: {{ $data['vehicle']->police_number }}</h4>
            @endif
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%;">Tanggal</th>
                        <th style="width: 15%;">No. Jurnal</th>
                        <th style="width: 40%;">Keterangan</th>
                        <th style="width: 11%; text-align: right;">Debit</th>
                        <th style="width: 11%; text-align: right;">Kredit</th>
                        <th style="width: 13%; text-align: right;">Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #fdfdfd; font-weight: bold; font-size: 0.9em;">
                        <td colspan="5" style="text-align: right;">SALDO AWAL</td>
                        <td style="text-align: right;">{{ number_format($data['opening_balance'], 0, ',', '.') }}</td>
                    </tr>
                    
                    @if(count($data['transactions']) === 0)
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 8px; font-size: 0.85em; color: #777;">Tidak ada transaksi.</td>
                    </tr>
                    @else
                        @foreach($data['transactions'] as $t)
                        <tr style="font-size: 0.85em;">
                            <td style="text-align: center;">{{ \Carbon\Carbon::parse($t['date'])->format('d/m/y') }}</td>
                            <td style="text-align: center;">{{ $t['journal_number'] }}</td>
                            <td>{{ $t['description'] }}</td>
                            <td style="text-align: right;">{{ $t['debit'] > 0 ? number_format($t['debit'], 0, ',', '.') : '-' }}</td>
                            <td style="text-align: right;">{{ $t['credit'] > 0 ? number_format($t['credit'], 0, ',', '.') : '-' }}</td>
                            <td style="text-align: right;">{{ number_format($t['balance'], 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                    @endif

                    <tr style="background-color: #f9f9f9; font-weight: bold; font-size: 0.9em;">
                        <td colspan="3" style="text-align: right;">TOTAL</td>
                        <td style="text-align: right;">{{ number_format($data['debit_total'], 0, ',', '.') }}</td>
                        <td style="text-align: right;">{{ number_format($data['credit_total'], 0, ',', '.') }}</td>
                        <td style="text-align: right;">{{ number_format($data['closing_balance'], 0, ',', '.') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach
@endforeach
@endsection
