@extends('pdf.reports.base')

@section('content')
<div class="filter-section">
    <table class="filter-grid" style="margin:0;">
        <tr>
            <td class="filter-label" style="border:none; padding:2px;">LAPORAN</td>
            <td style="border:none; padding:2px;">: BUKU BESAR LENGKAP</td>
        </tr>
        <tr>
            <td class="filter-label" style="border:none; padding:2px;">PERIODE</td>
            <td style="border:none; padding:2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}</td>
        </tr>
        @if($vehicleId)
        <tr>
            <td class="filter-label" style="border:none; padding:2px;">DIVISI</td>
            <td style="border:none; padding:2px;">: {{ \App\Models\Vehicle::find($vehicleId)?->police_number ?? '-' }}</td>
        </tr>
        @endif
        @if($bankId)
        <tr>
            <td class="filter-label" style="border:none; padding:2px;">KAS / BANK</td>
            <td style="border:none; padding:2px;">: {{ \App\Models\Bank::find($bankId)?->name ?? '-' }}</td>
        </tr>
        @endif
    </table>
</div>

@foreach($allLedgerData as $index => $item)
    <div class="account-header">
        AKUN: {{ $item['account']->code }} — {{ $item['account']->name }}
    </div>
    
    @php
        $displayData = count($item['grouped']) > 0 ? $item['grouped'] : [$item['summary']];
        
        // Group by bank
        $bankGroupsAll = [];
        foreach($displayData as $d) {
            $bankName = isset($d['bank']) ? (is_object($d['bank']) ? $d['bank']->name : $d['bank']) : 'TANPA KAS';
            $bankGroupsAll[$bankName][] = $d;
        }
    @endphp

    @foreach($bankGroupsAll as $bankName => $vehicleData)
        <div class="bank-header">
            {{ $bankName }}
        </div>

        @foreach($vehicleData as $data)
            <div style="margin-bottom: 25px;">
                @if(isset($data['vehicle']) && (is_object($data['vehicle']) ? $data['vehicle']->police_number : $data['vehicle']) !== 'None')
                    <span class="divisi-header">
                        DIVISI: {{ is_object($data['vehicle']) ? $data['vehicle']->police_number : $data['vehicle'] }}
                    </span>
                @else
                    <span class="divisi-header">UMUM / TANPA DIVISI</span>
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
                        <tr class="row-opening-balance">
                            <td colspan="5" class="text-right" style="font-size: 0.9em;">SALDO AWAL</td>
                            <td class="text-right">{{ number_format($data['opening_balance'], 0, ',', '.') }}</td>
                        </tr>
                        
                        @if(count($data['transactions']) === 0)
                        <tr>
                            <td colspan="6" class="text-center" style="color: #777; padding: 15px;">Tidak ada transaksi selama periode ini.</td>
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
                            <td colspan="3" class="text-right">TOTAL</td>
                            <td class="text-right text-success">{{ number_format($data['debit_total'], 0, ',', '.') }}</td>
                            <td class="text-right text-danger">{{ number_format($data['credit_total'], 0, ',', '.') }}</td>
                            <td class="text-right">{{ number_format($data['closing_balance'], 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        @endforeach
    @endforeach
@endforeach
@endsection
