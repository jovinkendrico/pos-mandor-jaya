@extends('pdf.reports.base')

@section('content')
<div class="filter-section">
    <table class="filter-table" style="margin:0;">
        <tr>
            <td class="filter-label">KODE AKUN</td>
            <td style="border:none; padding:2px;">: {{ $account->code }}</td>
        </tr>
        <tr>
            <td class="filter-label">NAMA AKUN</td>
            <td style="border:none; padding:2px; font-weight: bold;">: {{ $account->name }}</td>
        </tr>
        <tr>
            <td class="filter-label">PERIODE</td>
            <td style="border:none; padding:2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d F Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d F Y') }}</td>
        </tr>
    </table>
</div>

@php
    $displays = count($groupedLedgerData) > 0 ? $groupedLedgerData : [$ledgerData];
    
    // Group by bank
    $bankGroups = [];
    foreach($displays as $data) {
        $bankName = isset($data['bank']) ? (is_object($data['bank']) ? $data['bank']->name : $data['bank']) : 'TANPA KAS';
        $bankGroups[$bankName][] = $data;
    }
@endphp

@foreach($bankGroups as $bankName => $vehicleData)
    <div class="bank-header">
        SUMBER KAS: {{ $bankName }}
    </div>

    @foreach($vehicleData as $data)
        <div style="margin-bottom: 30px;">
            <div class="divisi-header">
                @if(isset($data['vehicle']) && (is_object($data['vehicle']) ? $data['vehicle']->police_number : $data['vehicle']) !== 'None')
                    DIVISI / UNIT: {{ is_object($data['vehicle']) ? $data['vehicle']->police_number : $data['vehicle'] }}
                @else
                    UMUM / TANPA DIVISI
                @endif
            </div>
            
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
                    <tr class="row-opening-balance">
                        <td colspan="5" class="text-right">SALDO AWAL</td>
                        <td class="text-right">{{ number_format($data['opening_balance'], 0, ',', '.') }}</td>
                    </tr>
                    
                    @if(count($data['transactions']) === 0)
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 15px; color: #777;">Tidak ada aktivitas transaksi untuk unit ini pada periode tersebut.</td>
                    </tr>
                    @else
                        @foreach($data['transactions'] as $t)
                        <tr>
                            <td class="text-center">{{ \Carbon\Carbon::parse($t['date'])->format('d/m/y') }}</td>
                            <td class="text-center font-bold" style="font-size: 8px;">{{ $t['journal_number'] }}</td>
                            <td>{{ $t['description'] }}</td>
                            <td class="text-right text-success">{{ $t['debit'] > 0 ? number_format($t['debit'], 0, ',', '.') : '-' }}</td>
                            <td class="text-right text-danger">{{ $t['credit'] > 0 ? number_format($t['credit'], 0, ',', '.') : '-' }}</td>
                            <td class="text-right font-bold">{{ number_format($t['balance'], 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                    @endif

                    <tr class="row-total">
                        <td colspan="3" class="text-right">TOTAL AKHIR</td>
                        <td class="text-right text-success">{{ number_format($data['debit_total'], 0, ',', '.') }}</td>
                        <td class="text-right text-danger">{{ number_format($data['credit_total'], 0, ',', '.') }}</td>
                        <td class="text-right">{{ number_format($data['closing_balance'], 0, ',', '.') }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    @endforeach
@endforeach
@endsection
