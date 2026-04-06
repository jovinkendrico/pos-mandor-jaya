<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCashInRequest;
use App\Http\Requests\UpdateCashInRequest;
use App\Models\CashIn;
use App\Models\Bank;
use App\Models\ChartOfAccount;
use App\Services\JournalService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CashInController extends Controller
{
    public function __construct(private readonly JournalService $journalService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = CashIn::with(['bank', 'chartOfAccount', 'creator', 'updater'])
            ->orderBy('cash_in_date', 'desc')
            ->orderBy('id', 'desc');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('cash_in_number', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('bank', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('chartOfAccount', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by date range
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('cash_in_date', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('cash_in_date', '<=', $request->date_to);
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by bank
        if ($request->has('bank_id') && $request->bank_id) {
            $query->where('bank_id', $request->bank_id);
        }

        // Filter by reference type
        if ($request->has('reference_type') && $request->reference_type !== 'all') {
            if ($request->reference_type === 'manual') {
                $query->where(function ($q) {
                    $q->whereNull('reference_type')
                        ->orWhere('reference_type', '');
                });
            } else {
                $query->where('reference_type', $request->reference_type);
            }
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');

        $allowedSortFields = ['cash_in_date', 'cash_in_number', 'amount', 'status', 'id'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('id', 'desc');
        }

        $cashIns = $query->paginate(10)->withQueryString();

        // Get banks for filter
        $banks = \App\Models\Bank::orderBy('name')->get(['id', 'name']);

        return Inertia::render('transaction/cash-in/index', [
            'cashIns' => $cashIns,
            'banks' => $banks,
            'filters' => [
                'search' => $request->get('search', ''),
                'date_from' => $request->get('date_from', ''),
                'date_to' => $request->get('date_to', ''),
                'status' => $request->get('status', 'all'),
                'bank_id' => $request->get('bank_id', ''),
                'reference_type' => $request->get('reference_type', 'all'),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $banks = Bank::orderBy('name')->get();
        // Get accounts (including expense for refunds/reversals)
        $incomeAccounts = ChartOfAccount::whereIn('type', ['income', 'revenue', 'pendapatan', 'expense', 'biaya', 'pengeluaran', 'equity', 'liability', 'asset'])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('transaction/cash-in/create', [
            'banks' => $banks,
            'incomeAccounts' => $incomeAccounts,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCashInRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            // Generate cash in number with retry logic to handle race conditions
            $maxRetries = 5;
            $cashIn = null;

            for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
                try {
                    $cashInNumber = CashIn::generateCashInNumber();

                    $attachmentPath = $this->handleAttachment($request);

                    $cashIn = CashIn::create([
                        'cash_in_number' => $cashInNumber,
                        'cash_in_date' => $request->cash_in_date,
                        'bank_id' => $request->bank_id,
                        'chart_of_account_id' => $request->chart_of_account_id,
                        'amount' => $request->amount,
                        'attachment' => $attachmentPath,
                        'description' => $request->description,
                        'status' => $request->auto_post ? 'posted' : 'draft',
                        'reference_type' => 'Manual',
                        'created_by' => auth()->id(),
                        'updated_by' => auth()->id(),
                    ]);

                    break; // Success, exit retry loop
                } catch (\Illuminate\Database\QueryException $e) {
                    // Check if it's a unique constraint violation (SQLSTATE 23000)
                    if ($e->getCode() == 23000 && (str_contains($e->getMessage(), 'cash_in_number') || str_contains($e->getMessage(), 'cash_ins_cash_in_number_unique'))) {
                        if ($attempt === $maxRetries - 1) {
                            throw $e; // Re-throw on last attempt
                        }
                        // Wait a tiny bit before retrying (microseconds)
                        usleep(10000 * ($attempt + 1)); // 10ms, 20ms, 30ms, etc.
                        continue;
                    }
                    throw $e; // Re-throw if it's a different error
                }
            }

            // Auto post to journal if requested
            if ($request->auto_post) {
                $this->journalService->postCashIn($cashIn);
            }
        });

        return redirect()->route('cash-ins.index')
            ->with('success', 'Kas masuk berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(CashIn $cashIn): Response
    {
        $cashIn->loadMissing(['bank', 'chartOfAccount', 'creator', 'updater']);

        return Inertia::render('transaction/cash-in/show', [
            'cashIn' => $cashIn,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(CashIn $cashIn): \Illuminate\Http\RedirectResponse|Response
    {
        if ($cashIn->status === 'posted') {
            return redirect()->route('cash-ins.show', $cashIn)
                ->with('error', 'Kas masuk yang sudah diposting tidak dapat diedit.');
        }

        $banks = Bank::orderBy('name')->get();
        $incomeAccounts = ChartOfAccount::whereIn('type', ['income', 'revenue', 'pendapatan', 'expense', 'biaya', 'pengeluaran', 'equity', 'liability', 'asset'])
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('transaction/cash-in/edit', [
            'cashIn' => $cashIn,
            'banks' => $banks,
            'incomeAccounts' => $incomeAccounts,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCashInRequest $request, CashIn $cashIn): RedirectResponse
    {
        if ($cashIn->status === 'posted') {
            return redirect()->route('cash-ins.show', $cashIn)
                ->with('error', 'Kas masuk yang sudah diposting tidak dapat diedit.');
        }

        DB::transaction(function () use ($request, $cashIn) {
            $attachmentPath = $this->handleAttachment($request, $cashIn->attachment);

            $updateData = array(
                'cash_in_date' => $request->cash_in_date,
                'bank_id' => $request->bank_id,
                'chart_of_account_id' => $request->chart_of_account_id,
                'amount' => $request->amount,
                'attachment' => $attachmentPath,
                'description' => $request->description,
                'updated_by' => auth()->id(),
            );
            $cashIn->update($updateData);

            // Auto post if requested
            if ($request->auto_post && $cashIn->status === 'draft') {
                $this->journalService->postCashIn($cashIn);
            }
        });

        return redirect()->route('cash-ins.index')
            ->with('success', 'Kas masuk berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CashIn $cashIn): RedirectResponse
    {
        if ($cashIn->status === 'posted') {
            return redirect()->route('cash-ins.show', $cashIn)
                ->with('error', 'Kas masuk yang sudah diposting tidak dapat dihapus. Silakan reverse terlebih dahulu.');
        }

        $cashIn->delete();

        return redirect()->route('cash-ins.index')
            ->with('success', 'Kas masuk berhasil dihapus.');
    }

    /**
     * Post cash in to journal
     */
    public function post(CashIn $cashIn): RedirectResponse
    {
        if ($cashIn->status === 'posted') {
            return back()->with('error', 'Kas masuk sudah diposting.');
        }

        try {
            $this->journalService->postCashIn($cashIn);
            return back()->with('success', 'Kas masuk berhasil diposting ke jurnal.');
        } catch (\Exception $e) {
            $errorMessage = 'Gagal memposting: ' . $e->getMessage();
            return back()->withErrors(['msg' => $errorMessage]);
        }
    }

    /**
     * Reverse posted cash in
     */
    public function reverse(CashIn $cashIn): RedirectResponse
    {
        if ($cashIn->status !== 'posted') {
            return back()->with('error', 'Hanya kas masuk yang sudah diposting yang dapat di-reverse.');
        }

        try {
            $this->journalService->reverseCashIn($cashIn);
            return back()->with('success', 'Kas masuk berhasil di-reverse.');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal reverse: ' . $e->getMessage());
        }
    }

    /**
     * Handle attachment upload and compression
     */
    private function handleAttachment(Request $request, $oldPath = null): ?string
    {
        if (!$request->hasFile('attachment')) {
            return $oldPath;
        }

        $file = $request->file('attachment');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('attachments/cash-in', $fileName, 'public');

        // Compression logic using GD (as a second layer of defense)
        $fullPath = storage_path('app/public/' . $path);

        try {
            $info = getimagesize($fullPath);
            if ($info) {
                $mime = $info['mime'];
                switch ($mime) {
                    case 'image/jpeg':
                        $image = imagecreatefromjpeg($fullPath);
                        if ($image) {
                            $width = imagesx($image);
                            $height = imagesy($image);
                            $maxSize = 1200;
                            
                            if ($width > $maxSize || $height > $maxSize) {
                                if ($width > $height) {
                                    $newWidth = $maxSize;
                                    $newHeight = (int) ($height * ($maxSize / $width));
                                } else {
                                    $newHeight = $maxSize;
                                    $newWidth = (int) ($width * ($maxSize / $height));
                                }
                                $newImage = imagecreatetruecolor($newWidth, $newHeight);
                                imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
                                imagedestroy($image);
                                $image = $newImage;
                            }
                            
                            imagejpeg($image, $fullPath, 60);
                            imagedestroy($image);
                        }
                        break;
                    case 'image/png':
                        $image = imagecreatefrompng($fullPath);
                        if ($image) {
                            imagealphablending($image, false);
                            imagesavealpha($image, true);
                            imagepng($image, $fullPath, 6);
                            imagedestroy($image);
                        }
                        break;
                }
            }
        } catch (\Exception $e) {
            // Ignore compression errors
        }

        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        return $path;
    }
}
