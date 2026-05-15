<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 7px; /* Very small font for detail comparison */
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
        }

        .header h1 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            table-layout: fixed;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 3px 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        th {
            background-color: #4a5568;
            color: white;
            font-weight: bold;
            text-align: center;
        }

        .category-header {
            background-color: #f7fafc;
            font-weight: bold;
            font-size: 8px;
        }

        .total-row {
            font-weight: bold;
            background-color: #edf2f7;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .footer {
            margin-top: 15px;
            padding-top: 5px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 6px;
            color: #666;
        }

        /* Column widths */
        .col-account { width: 14%; }
        .col-month { width: 7.16%; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div>Tahun: {{ $year }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th class="col-account">Akun</th>
                @foreach($monthNames as $month)
                    <th class="col-month">{{ $month }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            {{-- ASSETS --}}
            <tr class="category-header">
                <td colspan="13">AKTIVA (ASET)</td>
            </tr>
            @foreach($assetDetails as $account)
            <tr>
                <td>{{ $account['code'] }} - {{ $account['name'] }}</td>
                @foreach($account['balances'] as $balance)
                    <td class="text-right">{{ number_format($balance, 0, ',', '.') }}</td>
                @endforeach
            </tr>
            @endforeach
            <tr class="total-row">
                <td>TOTAL AKTIVA</td>
                @foreach($monthlyTotals['assets'] as $total)
                    <td class="text-right">{{ number_format($total, 0, ',', '.') }}</td>
                @endforeach
            </tr>

            {{-- LIABILITIES --}}
            <tr class="category-header">
                <td colspan="13">KEWAJIBAN (PASIVA)</td>
            </tr>
            @foreach($liabilityDetails as $account)
            <tr>
                <td>{{ $account['code'] }} - {{ $account['name'] }}</td>
                @foreach($account['balances'] as $balance)
                    <td class="text-right">{{ number_format($balance, 0, ',', '.') }}</td>
                @endforeach
            </tr>
            @endforeach
            <tr class="total-row">
                <td>TOTAL KEWAJIBAN</td>
                @foreach($monthlyTotals['liabilities'] as $total)
                    <td class="text-right">{{ number_format($total, 0, ',', '.') }}</td>
                @endforeach
            </tr>

            {{-- EQUITY --}}
            <tr class="category-header">
                <td colspan="13">EKUITAS (MODAL)</td>
            </tr>
            @foreach($equityDetails as $account)
            <tr>
                <td>{{ $account['code'] }} - {{ $account['name'] }}</td>
                @foreach($account['balances'] as $balance)
                    <td class="text-right">{{ number_format($balance, 0, ',', '.') }}</td>
                @endforeach
            </tr>
            @endforeach
            <tr class="total-row">
                <td>TOTAL EKUITAS</td>
                @foreach($monthlyTotals['equity'] as $total)
                    <td class="text-right">{{ number_format($total, 0, ',', '.') }}</td>
                @endforeach
            </tr>

            {{-- GRAND TOTAL PASSIVA --}}
            <tr class="total-row" style="background-color: #e2e8f0;">
                <td>PASIVA + EKUITAS</td>
                @foreach($monthlyTotals['liabilities'] as $idx => $lTotal)
                    <td class="text-right">{{ number_format($lTotal + $monthlyTotals['equity'][$idx], 0, ',', '.') }}</td>
                @endforeach
            </tr>
            
            <tr class="total-row">
                <td>STATUS</td>
                @foreach($monthlyTotals['assets'] as $idx => $aTotal)
                    @php
                        $pTotal = $monthlyTotals['liabilities'][$idx] + $monthlyTotals['equity'][$idx];
                        $isBalanced = abs($aTotal - $pTotal) < 0.01;
                    @endphp
                    <td class="text-center">
                        @if($isBalanced)
                            OK
                        @else
                            ERR
                        @endif
                    </td>
                @endforeach
            </tr>
        </tbody>
    </table>

    <div style="margin-top: 10px; font-size: 6px;">
        <p>* Laba/Rugi Tahun Berjalan dihitung dari awal tahun sampai akhir bulan tersebut.</p>
        <p>* Total Ekuitas sudah termasuk Laba/Rugi Tahun Berjalan.</p>
    </div>

    <div class="footer">
        Dicetak pada: {{ \Carbon\Carbon::now()->format('d M Y H:i:s') }}
    </div>
</body>
</html>
