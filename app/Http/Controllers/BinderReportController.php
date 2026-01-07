<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BinderReportController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Sale::with(['details.item', 'details.itemUom.uom', 'customer', 'creator'])
            ->whereIn('status', ['confirmed', 'pending'])
            ->orderBy('sale_date', 'desc')
            ->orderBy('sale_number', 'desc');

        if ($request->filled('date_from')) {
            $query->whereDate('sale_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('sale_date', '<=', $request->date_to);
        }

        return Inertia::render('reports/binder/index', [
            'filters' => $request->all(['date_from', 'date_to']),
            'sales' => $query->paginate(10)->withQueryString(),
        ]);
    }

    public function print(Request $request)
    {
        try {
            $query = Sale::with(['details.item', 'details.itemUom.uom', 'customer', 'creator'])
                ->whereIn('status', ['confirmed', 'pending'])
                ->orderBy('sale_date', 'desc')
                ->orderBy('sale_number', 'desc');

            if ($request->filled('date_from')) {
                $query->whereDate('sale_date', '>=', $request->date_from);
            }
            if ($request->filled('date_to')) {
                $query->whereDate('sale_date', '<=', $request->date_to);
            }

            $sales = $query->get();

            // Prepare data: flatten or keep structured?
            // "Setiap halaman terdapat 10 mj"
            // We pass chunks of sales. View will handle iterating and page breaks.
            $chunks = $sales->chunk(10);

            $pdf = Pdf::loadView('pdf.reports.binder', [
                'chunks' => $chunks,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
                'title' => 'Laporan Binder (10 MJ/Halaman)',
            ])->setPaper('a4', 'landscape');

            $filename = 'laporan-binder-' . now()->format('Y-m-d-His') . '.pdf';
            
            return $pdf->stream($filename); // View in browser first, user can download
            
        } catch (\Exception $e) {
            Log::error('Binder Report Error', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return back()->with('error', 'Gagal membuat laporan: ' . $e->getMessage());
        }
    }
}
