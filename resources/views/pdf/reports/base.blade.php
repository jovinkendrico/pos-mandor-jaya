<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        /* Modern PDF Theme for Mandor Jaya */
        @page {
            size: A4 landscape;
            margin: 0.8cm 1cm;
        }

        :root {
            --primary: #1a202c;
            --secondary: #2d3748;
            --accent: #4a5568;
            --light: #f7fafc;
            --border: #e2e8f0;
            --text-dark: #1a202c;
            --text-muted: #718096;
            --success: #2f855a;
            --danger: #c53030;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: var(--text-dark);
            line-height: 1.4;
        }

        /* Header Styles */
        .report-header {
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 3px solid var(--primary);
        }

        .company-info {
            float: left;
            width: 50%;
        }

        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: var(--primary);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .report-meta {
            float: right;
            width: 50%;
            text-align: right;
        }

        .report-title {
            font-size: 14px;
            font-weight: bold;
            color: var(--secondary);
            margin-bottom: 3px;
        }

        .date-range {
            font-size: 10px;
            color: var(--text-muted);
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }

        /* Filter Info Box */
        .filter-section {
            margin-bottom: 20px;
            background-color: var(--light);
            padding: 10px 15px;
            border-left: 4px solid var(--accent);
            border-radius: 0 4px 4px 0;
        }

        .filter-grid {
            width: 100%;
        }

        .filter-item {
            font-size: 9px;
            padding: 2px 0;
        }

        .filter-label {
            font-weight: bold;
            color: var(--accent);
            width: 100px;
        }

        /* Table Design */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: transparent;
        }

        th {
            background-color: var(--secondary);
            color: white;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            padding: 8px 10px;
            text-align: center;
            border: none;
        }

        td {
            padding: 8px 10px;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
        }

        /* Zebra Striping */
        tr:nth-child(even) {
            background-color: #fcfcfc;
        }

        /* Grouping Headers */
        .account-header {
            background-color: var(--primary);
            color: white;
            padding: 10px 15px;
            margin-top: 30px;
            margin-bottom: 10px;
            font-size: 13px;
            font-weight: bold;
            border-radius: 4px;
        }

        .bank-header {
            background-color: #edf2f7;
            border-bottom: 2px solid var(--accent);
            color: var(--secondary);
            padding: 8px 15px;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .divisi-header {
            color: var(--accent);
            font-size: 10px;
            font-weight: bold;
            margin-top: 15px;
            margin-bottom: 5px;
            margin-left: 10px;
            padding-bottom: 3px;
            border-bottom: 1px solid var(--border);
            display: block;
        }

        /* Row Types */
        .row-opening-balance {
            background-color: #fdfdfd !important;
            font-weight: bold;
            color: var(--accent);
        }

        .row-total {
            background-color: #f8fafc !important;
            font-weight: bold;
            color: var(--text-dark);
            border-top: 2px solid var(--border);
        }

        /* Utility Classes */
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-success { color: var(--success); }
        .text-danger { color: var(--danger); }
        .font-bold { font-weight: bold; }

        /* Footer */
        .footer {
            position: fixed;
            bottom: -30px;
            left: 0;
            right: 0;
            height: 30px;
            font-size: 8px;
            color: var(--text-muted);
            text-align: right;
            border-top: 1px solid var(--border);
            padding-top: 5px;
        }

        .page-number:after {
            content: counter(page);
        }
    </style>
</head>
<body>
    <div class="report-header clearfix">
        <div class="company-info">
            <div class="company-name">Mandor Jaya</div>
            <div style="font-size: 9px; color: var(--text-muted);">
                Sistem Informasi Akuntansi & Manajemen Operasional
            </div>
        </div>
        <div class="report-meta">
            <div class="report-title">{{ $title }}</div>
            <div class="date-range">
                @if(isset($dateFrom) && isset($dateTo))
                    Periode: {{ \Carbon\Carbon::parse($dateFrom)->format('d F Y') }} - {{ \Carbon\Carbon::parse($dateTo)->format('d F Y') }}
                @elseif(isset($asOfDate))
                    Per Tanggal: {{ \Carbon\Carbon::parse($asOfDate)->format('d F Y') }}
                @else
                    Dicetak pada: {{ \Carbon\Carbon::now()->translatedFormat('d F Y H:i') }}
                @endif
            </div>
        </div>
    </div>

    @yield('content')

    <div class="footer">
        <span style="float: left;">Dicetak otomatis oleh Sistem Mandor Jaya</span>
        Halaman <span class="page-number"></span>
    </div>
</body>
</html>
