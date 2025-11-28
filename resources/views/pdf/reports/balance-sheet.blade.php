<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page {
            size: A4 portrait;
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

        .balance-sheet {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }

        .column {
            flex: 1;
        }

        .section {
            margin-bottom: 20px;
        }

        .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 10px;
            padding: 5px;
            background-color: #4a5568;
            color: white;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
        }

        th {
            background-color: #e0e0e0;
            font-weight: bold;
        }

        .text-right {
            text-align: right;
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
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div>Per Tanggal: {{ \Carbon\Carbon::parse($asOfDate)->format('d M Y') }}</div>
    </div>

    <div class="balance-sheet">
        <div class="column">
            <div class="section">
                <div class="section-title">ASET</div>
                <table>
                    <thead>
                        <tr>
                            <th>Akun</th>
                            <th class="text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($assetDetails as $asset)
                        <tr>
                            <td>{{ $asset['code'] }} - {{ $asset['name'] }}</td>
                            <td class="text-right">{{ number_format($asset['balance'], 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                        <tr class="total-row">
                            <td>TOTAL ASET</td>
                            <td class="text-right">{{ number_format($totalAssets, 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="column">
            <div class="section">
                <div class="section-title">KEWAJIBAN</div>
                <table>
                    <thead>
                        <tr>
                            <th>Akun</th>
                            <th class="text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($liabilityDetails as $liability)
                        <tr>
                            <td>{{ $liability['code'] }} - {{ $liability['name'] }}</td>
                            <td class="text-right">{{ number_format($liability['balance'], 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                        <tr class="total-row">
                            <td>TOTAL KEWAJIBAN</td>
                            <td class="text-right">{{ number_format($totalLiabilities, 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="section">
                <div class="section-title">EKUITAS</div>
                <table>
                    <thead>
                        <tr>
                            <th>Akun</th>
                            <th class="text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($equityDetails as $equity)
                        <tr>
                            <td>{{ $equity['code'] }} - {{ $equity['name'] }}</td>
                            <td class="text-right">{{ number_format($equity['balance'], 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                        <tr class="total-row">
                            <td>TOTAL EKUITAS</td>
                            <td class="text-right">{{ number_format($totalEquity, 0, ',', '.') }}</td>
                        </tr>
                        <tr class="total-row">
                            <td>TOTAL KEWAJIBAN + EKUITAS</td>
                            <td class="text-right">{{ number_format($totalLiabilitiesAndEquity, 0, ',', '.') }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="footer">
        Dicetak pada: {{ \Carbon\Carbon::now()->format('d M Y H:i:s') }}
    </div>
</body>
</html>


