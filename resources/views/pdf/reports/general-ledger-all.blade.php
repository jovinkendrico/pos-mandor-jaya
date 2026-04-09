@extends('pdf.reports.base')

@section('content')
<div style="margin-bottom: 20px;">
    <table>
        <tr>
            <td style="width: 120px; font-weight: bold; border: none; padding: 2px;">Laporan</td>
            <td style="border: none; padding: 2px;">: Buku Besar Lengkap</td>
        </tr>
        <tr>
            <td style="font-weight: bold; border: none; padding: 2px;">Periode</td>
            <td style="border: none; padding: 2px;">: {{ \Carbon\Carbon::parse($dateFrom)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($dateTo)->format('d/m/Y') }}</td>
        </tr>
    </table>
</div>

@foreach($allLedgerData as $index => $item)
    <div style="margin-top: {{ $index > 0 ? '40px' : '20px' }};">
        <h3 style="border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
            Akun: {{ $item['account']->code }} - {{ $item['account']->name }}
        </h3>
        
        @php
            $displayData = count($item['grouped']) > 0 ? $item['grouped'] : [$item['summary']];
        @endphp

        @foreach($displayData as $data)
            <div style="margin-top: 15px;">
                @if(isset($data['vehicle']))
                    <div style="font-weight: bold; margin-bottom: 5px; background-color: #f0f0f0; padding: 4px;">
                        Divisi: {{ $data['vehicle']->police_number }}
                    </div>
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
                        <tr style="background-color: #f9f9f9; font-weight: bold;">
                            <td colspan="5" style="text-align: right; font-size: 0.9em;">SALDO AWAL</td>
                            <td style="text-align: right; font-size: 0.9em;">{{ number_format($data['opening_balance'], 0, ',', '.') }}</td>
                        </tr>
                        
                        @if(count($data['transactions']) === 0)
                        <tr>
                            <td colspan="6" style="text-align: center; padding: 10px; font-size: 0.85em;">Tidak ada transaksi.</td>
                        </tr>
                        @else
                            @foreach($data['transactions'] as $t)
                            <tr style="font-size: 0.85em;">
                                <td style="text-align: center;">{{ \Carbon\Carbon::parse($t['date'])->format('d/m/Y') }}</td>
                                <td style="text-align: center;">{{ $t['journal_number'] }}</td>
                                <td>{{ $t['description'] }}</td>
                                <td style="text-align: right;">{{ $t['debit'] > 0 ? number_format($t['debit'], 0, ',', '.') : '-' }}</td>
                                <td style="text-align: right;">{{ $t['credit'] > 0 ? number_format($t['credit'], 0, ',', '.') : '-' }}</td>
                                <td style="text-align: right;">{{ number_format($t['balance'], 0, ',', '.') }}</td>
                            </tr>
                            @endforeach
                        @endif

                        <tr style="background-color: #f9f9f9; font-weight: bold; font-size: 0.9em;">
                            <td colspan="3" style="text-align: right;">TOTAL @if(isset($data['vehicle'])) ({{ $data['vehicle']->police_number }}) @endif</td>
                            <td style="text-align: right;">{{ number_format($data['debit_total'], 0, ',', '.') }}</td>
                            <td style="text-align: right;">{{ number_format($data['credit_total'], 0, ',', '.') }}</td>
                            <td style="text-align: right;">{{ number_format($data['closing_balance'], 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        @endforeach
    </div>
@endforeach
@endsection
