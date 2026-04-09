<?php

namespace App\Http\Controllers;

use App\Models\Bank;
use App\Models\CashMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class BankCashMovementReportController extends Controller
{
    /**
     * Display bank cash movement report selection & preview
     */
    public function index(Request $request): Response
    {
        $banks = Bank::orderBy('name')->get();
        
        $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $bankId = $request->get('bank_id');

        $transactions = [];
        $openingBalance = 0;
        $closingBalance = 0;
        $selectedBank = null;

        if ($bankId) {
            $selectedBank = Bank::find($bankId);
            
            if ($selectedBank) {
                // Get opening balance
                $openingBalance = (float) ($selectedBank->initial_balance ?? 0);
                
                if ($dateFrom) {
                    $lastMovementBefore = CashMovement::where('bank_id', $selectedBank->id)
                        ->whereDate('movement_date', '<', $dateFrom)
                        ->orderBy('movement_date', 'desc')
                        ->orderBy('id', 'desc')
                        ->first();

                    if ($lastMovementBefore) {
                        $openingBalance = (float) $lastMovementBefore->balance;
                    }
                }

                $query = CashMovement::where('bank_id', $selectedBank->id)
                    ->whereDate('movement_date', '>=', $dateFrom)
                    ->whereDate('movement_date', '<=', $dateTo)
                    ->orderBy('movement_date', 'asc')
                    ->orderBy('id', 'asc');

                $allMovements = $query->get();
                $balanceTracker = $openingBalance;

                foreach ($allMovements as $movement) {
                    $debit = (float) $movement->debit;
                    $credit = (float) $movement->credit;
                    $balanceTracker = round($balanceTracker + $debit - $credit, 2);

                    // Skip Saldo Awal entries as they are already part of the opening balance calculation
                    if ($movement->reference_type === 'Bank') {
                        continue;
                    }

                    // Get reference number based on reference type
                    $referenceNumber = '-';
                    if ($movement->reference_type && $movement->reference_id) {
                        switch ($movement->reference_type) {
                            case 'CashIn':
                                $ref = \App\Models\CashIn::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->cash_in_number : '-';
                                break;
                            case 'CashOut':
                                $ref = \App\Models\CashOut::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->cash_out_number : '-';
                                break;
                            case 'SalePayment':
                                $ref = \App\Models\SalePayment::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->payment_number : '-';
                                break;
                            case 'PurchasePayment':
                                $ref = \App\Models\PurchasePayment::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->payment_number : '-';
                                break;
                            case 'SaleReturn':
                                $ref = \App\Models\SaleReturn::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->return_number : '-';
                                break;
                            case 'PurchaseReturn':
                                $ref = \App\Models\PurchaseReturn::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->return_number : '-';
                                break;
                            case 'Bank':
                                $referenceNumber = 'Saldo Awal';
                                break;
                            case 'App\Models\Transfer':
                            case 'Transfer':
                                $ref = \App\Models\Transfer::find($movement->reference_id);
                                $referenceNumber = $ref ? $ref->transfer_number : '-';
                                break;
                        }
                    }

                    $typeStr = $movement->reference_type;
                    if ($typeStr === 'App\Models\Transfer') $typeStr = 'Transfer';
                    $typeValue = $typeStr ? strtolower(str_replace(['Sale', 'Purchase', 'App\\Models\\'], '', $typeStr)) : 'other';

                    $transactions[] = [
                        'id' => $movement->id,
                        'date' => $movement->movement_date->format('Y-m-d'),
                        'type' => $typeValue,
                        'reference_number' => $referenceNumber,
                        'description' => $movement->description,
                        'debit' => $debit,
                        'credit' => $credit,
                        'balance_before' => $balanceTracker - $debit + $credit,
                        'balance_after' => $balanceTracker,
                    ];
                }

                $closingBalance = $balanceTracker;
                
                // For Inertia preview, reverse the array so newest is at the top like BankController does
                $transactions = array_reverse($transactions);
            }
        }

        return Inertia::render('reports/bank-cash-movement/index', [
            'banks' => $banks,
            'selectedBank' => $selectedBank,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
            'transactions' => $transactions,
            'openingBalance' => $openingBalance,
            'closingBalance' => $closingBalance,
        ]);
    }

    /**
     * Print bank cash movement report as PDF
     */
    public function print(Request $request)
    {
        try {
            $dateFrom = $request->get('date_from', now()->startOfMonth()->format('Y-m-d'));
            $dateTo = $request->get('date_to', now()->format('Y-m-d'));
            $bankId = $request->get('bank_id');

            if (!$bankId) {
                return back()->withErrors(['message' => 'Silakan pilih Bank terlebih dahulu.']);
            }

            $selectedBank = Bank::findOrFail($bankId);
            
            // Get opening balance
            $openingBalance = (float) ($selectedBank->initial_balance ?? 0);
            
            $lastMovementBefore = CashMovement::where('bank_id', $selectedBank->id)
                ->whereDate('movement_date', '<', $dateFrom)
                ->orderBy('movement_date', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            if ($lastMovementBefore) {
                $openingBalance = (float) $lastMovementBefore->balance;
            }

            $allMovements = CashMovement::where('bank_id', $selectedBank->id)
                ->whereDate('movement_date', '>=', $dateFrom)
                ->whereDate('movement_date', '<=', $dateTo)
                ->orderBy('movement_date', 'asc')
                ->orderBy('id', 'asc')
                ->get();

            $balanceTracker = $openingBalance;
            $transactions = [];

            foreach ($allMovements as $movement) {
                $debit = (float) $movement->debit;
                $credit = (float) $movement->credit;
                $balanceTracker = round($balanceTracker + $debit - $credit, 2);

                // Skip Saldo Awal entries as they are already part of the opening balance calculation
                if ($movement->reference_type === 'Bank') {
                    continue;
                }

                $referenceNumber = '-';
                if ($movement->reference_type && $movement->reference_id) {
                    switch ($movement->reference_type) {
                        case 'CashIn':
                            $ref = \App\Models\CashIn::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->cash_in_number : '-';
                            break;
                        case 'CashOut':
                            $ref = \App\Models\CashOut::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->cash_out_number : '-';
                            break;
                        case 'SalePayment':
                            $ref = \App\Models\SalePayment::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->payment_number : '-';
                            break;
                        case 'PurchasePayment':
                            $ref = \App\Models\PurchasePayment::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->payment_number : '-';
                            break;
                        case 'SaleReturn':
                            $ref = \App\Models\SaleReturn::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->return_number : '-';
                            break;
                        case 'PurchaseReturn':
                            $ref = \App\Models\PurchaseReturn::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->return_number : '-';
                            break;
                        case 'Bank':
                            $referenceNumber = 'Saldo Awal';
                            break;
                        case 'App\Models\Transfer':
                        case 'Transfer':
                            $ref = \App\Models\Transfer::find($movement->reference_id);
                            $referenceNumber = $ref ? $ref->transfer_number : '-';
                            break;
                    }
                }

                $transactions[] = [
                    'date' => $movement->movement_date->format('d/m/Y'),
                    'reference' => $referenceNumber,
                    'description' => $movement->description,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => $balanceTracker,
                ];
            }

            $closingBalance = $balanceTracker;

            $pdf = Pdf::loadView('pdf.reports.bank-cash-movement', [
                'title' => 'Laporan Pergerakan Kas',
                'bank' => $selectedBank,
                'dateFrom' => $dateFrom,
                'dateTo' => $dateTo,
                'openingBalance' => $openingBalance,
                'closingBalance' => $closingBalance,
                'transactions' => $transactions,
            ])->setPaper('a4', 'portrait');

            $filename = 'pergerakan-kas-' . \Str::slug($selectedBank->name) . '-' . $dateFrom . '-to-' . $dateTo . '.pdf';
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('PDF Print Bank Cash Movement Report - Exception caught', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return back()->withErrors([
                'message' => 'Error generating PDF: ' . $e->getMessage(),
            ]);
        }
    }
}
