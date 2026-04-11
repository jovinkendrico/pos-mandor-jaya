@extends('pdf.reports.base')

@section('content')
<div style="margin-bottom: 20px;">
    <table>
        <tr>
            <td style="width: 120px; font-weight: bold; border: none; padding: 2px;">Laporan</td>
            <td style="border: none; padding: 2px;">: Laporan Pendapatan</td>
        </tr>
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Periode</td>
            <td style="border: none; padding: 2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}</td>
        </tr>
        @if($vehicleId)
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Filter Divisi</td>
            <td style="border: none; padding: 2px;">: {{ \App\Models\Vehicle::find($vehicleId)?->police_number ?? '-' }}</td>
        </tr>
        @endif
        @if($bankId)
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Filter Kas</td>
            <td style="border: none; padding: 2px;">: {{ \App\Models\Bank::find($bankId)?->name ?? '-' }}</td>
        </tr>
        @endif
    </table>
</div>

@foreach($allLedgerData as $index => $item)
    <div style="margin-top: {{ $index > 0 ? '30px' : '10px' }}; page-break-inside: auto;">
        <h2 style="border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; color: #000; font-size: 1.2em;">
            Akun: {{ $item['account']->code }} - {{ $item['account']->name }}
        </h2>
        
        @php
            $displayData = count($item['grouped']) > 0 ? $item['grouped'] : [$item['summary']];
            
            // Group by bank
            $bankGroupsAll = [];
            foreach($displayData as $d) {
                $bankName = isset($d['bank']) ? (is_object($d['bank']) ? $d['bank']->name : $d['bank']) : 'Tanpa Kas';
                $bankGroupsAll[$bankName][] = $d;
            }
        @endphp

        @foreach($bankGroupsAll as $bankName => $vehicleData)
            {{-- Only show bank header if it's NOT "Tanpa Kas" --}}
            @if($bankName !== 'Tanpa Kas')
                <div style="margin-top: 15px; background-color: #f5f5f5; padding: 5px; border-left: 5px solid #333;">
                    <h3 style="margin: 0; text-transform: uppercase; font-size: 1.05em;">{{ $bankName }}</h3>
                </div>
            @endif

            @foreach($vehicleData as $data)
                <div style="margin-top: 10px; margin-left: {{ $bankName !== 'Tanpa Kas' ? '15px' : '0' }};">
                    @if(isset($data['vehicle']) && (is_object($data['vehicle']) ? $data['vehicle']->police_number : $data['vehicle']) !== 'None')
                        <h4 style="margin-bottom: 5px; color: #555; border-bottom: 1px solid #ddd; display: inline-block; font-size: 0.95em;">
                            Divisi: {{ is_object($data['vehicle']) ? $data['vehicle']->police_number : $data['vehicle'] }}
                        </h4>
                    @endif

                    <table style="font-size: 0.8em; margin-bottom: 10px;">
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
                            <tr style="background-color: #fdfdfd; font-weight: bold;">
                                <td colspan="5" style="text-align: right;">SALDO AWAL</td>
                                <td style="text-align: right;">{{ number_format($data['opening_balance'], 0, ',', '.') }}</td>
                            </tr>
                            
                            @if(count($data['transactions']) === 0)
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 5px; color: #777;">Tidak ada transaksi.</td>
                            </tr>
                            @else
                                @foreach($data['transactions'] as $t)
                                <tr>
                                    <td style="text-align: center;">{{ \Carbon\Carbon::parse($t['date'])->format('d/m/y') }}</td>
                                    <td style="text-align: center;">{{ $t['journal_number'] }}</td>
                                    <td>{{ $t['description'] }}</td>
                                    <td style="text-align: right;">{{ $t['debit'] > 0 ? number_format($t['debit'], 0, ',', '.') : '-' }}</td>
                                    <td style="text-align: right;">{{ $t['credit'] > 0 ? number_format($t['credit'], 0, ',', '.') : '-' }}</td>
                                    <td style="text-align: right;">{{ number_format($t['balance'], 0, ',', '.') }}</td>
                                </tr>
                                @endforeach
                            @endif

                            <tr style="background-color: #f9f9f9; font-weight: bold;">
                                <td colspan="3" style="text-align: right;">TOTAL @if(isset($data['vehicle']) && is_object($data['vehicle']) && $data['vehicle']->police_number !== 'None') ({{ $data['vehicle']->police_number }}) @endif</td>
                                <td style="text-align: right;">{{ number_format($data['debit_total'], 0, ',', '.') }}</td>
                                <td style="text-align: right;">{{ number_format($data['credit_total'], 0, ',', '.') }}</td>
                                <td style="text-align: right;">{{ number_format($data['closing_balance'], 0, ',', '.') }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            @endforeach
        @endforeach
    </div>
@endforeach
@endsection
