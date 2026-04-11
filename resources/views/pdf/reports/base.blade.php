<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        /* Standar PDF Styling - Mandor Jaya */
        @page {
            size: A4 landscape;
            margin: 0.8cm 1cm;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #1a202c;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        /* Header Styles using Table for Stability */
        .header-table {
            width: 100%;
            border-bottom: 3px solid #1a202c;
            margin-bottom: 20px;
            padding-bottom: 10px;
        }

        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #1a202c;
            text-transform: uppercase;
        }

        .report-title {
            font-size: 14px;
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 2px;
        }

        .date-range {
            font-size: 10px;
            color: #718096;
        }

        /* Filter Info Box */
        .filter-section {
            margin-bottom: 20px;
            background-color: #f7fafc;
            padding: 10px 15px;
            border-left: 4px solid #4a5568;
        }

        .filter-table {
            width: 100%;
            border: none;
        }

        .filter-label {
            font-weight: bold;
            color: #4a5568;
            width: 100px;
            font-size: 9px;
            border: none !important;
        }

        /* Table Design */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        th {
            background-color: #2d3748;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            padding: 8px 10px;
            text-align: center;
            border: 1px solid #2d3748;
        }

        td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }

        /* Grouping Headers */
        .account-header {
            background-color: #1a202c;
            color: #ffffff;
            padding: 10px 15px;
            margin-top: 25px;
            margin-bottom: 10px;
            font-size: 13px;
            font-weight: bold;
        }

        .bank-header {
            background-color: #edf2f7;
            border-bottom: 2px solid #4a5568;
            color: #2d3748;
            padding: 8px 15px;
            margin-top: 15px;
            margin-bottom: 5px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .divisi-header {
            color: #4a5568;
            font-size: 10px;
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 5px;
            margin-left: 10px;
            padding-bottom: 2px;
            border-bottom: 1px solid #e2e8f0;
        }

        /* Row Styles */
        .row-opening-balance {
            background-color: #fcfcfc;
            font-weight: bold;
        }

        .row-total {
            background-color: #f8fafc;
            font-weight: bold;
        }

        /* Utility Classes */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-success { color: #2f855a; }
        .text-danger { color: #c53030; }
        .font-bold { font-weight: bold; }

        /* Footer */
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            height: 30px;
            font-size: 8px;
            color: #718096;
            text-align: right;
            border-top: 1px solid #e2e8f0;
            padding-top: 5px;
        }

        .page-number:after {
            content: counter(page);
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="border:none; padding:0; width:60%;">
                <div class="company-name">Mandor Jaya</div>
                <div style="font-size: 9px; color: #718096;">
                    Sistem Informasi Akuntansi & Manajemen Operasional
                </div>
            </td>
            <td style="border:none; padding:0; text-align:right;">
                <div class="report-title">{{ $title }}</div>
                <div class="date-range">
                    @if(isset($dateFrom) && isset($dateTo))
                        Periode: {{ \Carbon\Carbon::parse($dateFrom)->format('d F Y') }} - {{ \Carbon\Carbon::parse($dateTo)->format('d F Y') }}
                    @elseif(isset($asOfDate))
                        Per Tanggal: {{ \Carbon\Carbon::parse($asOfDate)->format('d F Y') }}
                    @else
                        Dicetak pada: {{ \Carbon\Carbon::now()->format('d/m/Y H:i') }}
                    @endif
                </div>
            </td>
        </tr>
    </table>

    @yield('content')

    <div class="footer">
        <div style="float: left;">Dicetak otomatis oleh Sistem Mandor Jaya</div>
        Halaman <span class="page-number"></span>
    </div>
</body>
</html>
