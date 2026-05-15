<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1.5cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }

        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }

        th {
            background-color: #4a5568;
            color: white;
            font-weight: bold;
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .total-row {
            font-weight: bold;
            background-color: #f0f0f0;
        }

        .footer {
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8px;
            color: #666;
        }

        .balanced {
            color: green;
            font-weight: bold;
        }

        .not-balanced {
            color: red;
            font-weight: bold;
        }
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
                <th>Bulan</th>
                <th class="text-right">Total Aktiva (Aset)</th>
                <th class="text-right">Total Kewajiban</th>
                <th class="text-right">Total Ekuitas (Modal)</th>
                <th class="text-right">Laba/Rugi Berjalan</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($reportData as $data)
            @php
                $totalPasiva = $data['total_liabilities'] + $data['total_equity'];
                $isBalanced = abs($data['total_assets'] - $totalPasiva) < 0.01;
            @endphp
            <tr>
                <td class="text-center">{{ $data['month'] }}</td>
                <td class="text-right">{{ number_format($data['total_assets'], 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($data['total_liabilities'], 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($data['total_equity'], 0, ',', '.') }}</td>
                <td class="text-right">{{ number_format($data['net_profit'], 0, ',', '.') }}</td>
                <td class="text-center">
                    @if($isBalanced)
                        <span class="balanced">OK</span>
                    @else
                        <span class="not-balanced">ERROR</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 20px; font-size: 9px;">
        <p>* Laba/Rugi Berjalan dihitung dari awal tahun sampai akhir bulan tersebut.</p>
        <p>* Total Ekuitas sudah termasuk Laba/Rugi Berjalan.</p>
    </div>

    <div class="footer">
        Dicetak pada: {{ \Carbon\Carbon::now()->format('d M Y H:i:s') }}
    </div>
</body>
</html>
