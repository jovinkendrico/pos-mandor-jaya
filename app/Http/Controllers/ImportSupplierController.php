<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportSupplierRequest;
use App\Models\Supplier;
use App\Models\City;
use App\Services\ImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ImportSupplierController extends Controller
{
    public function __construct(
        private readonly ImportService $importService
    ) {}

    /**
     * Show the import form
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('master/supplier/import');
    }

    /**
     * Download Excel template
     */
    public function downloadTemplate(): BinaryFileResponse
    {
        $headers = ['name', 'address', 'city_name', 'phone_number', 'contact_person'];
        $sampleRows = [
            ['PT Supplier ABC', 'Jl. Raya No. 123', 'Jakarta', '02112345678', 'John Doe'],
            ['CV Supplier XYZ', 'Jl. Merdeka No. 456', 'Bandung', '02298765432', 'Jane Smith'],
        ];

        $tempFile = $this->importService->generateExcelTemplate($headers, $sampleRows);

        return response()->download($tempFile, 'supplier_import_template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Handle the import
     */
    public function store(ImportSupplierRequest $request): RedirectResponse
    {
        try {
            $file = $request->file('file');
            $rows = $this->importService->parseExcel($file);

            $successCount = 0;
            $errorCount = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($rows as $rowIndex => $data) {
                try {
                    
                    // Validate required fields
                    if (empty($data['name'] ?? '')) {
                        $errors[] = "Row " . ($rowIndex + 1) . ": Name is required";
                        $errorCount++;
                        continue;
                    }

                    $name = trim($data['name'] ?? '');
                    $address = trim($data['address'] ?? '');
                    $cityName = trim($data['city_name'] ?? '');
                    $phoneNumber = trim($data['phone_number'] ?? '');
                    $contactPerson = trim($data['contact_person'] ?? '');

                    // Find or create city if city name provided
                    $cityId = null;
                    if (!empty($cityName)) {
                        $city = City::firstOrCreate(['name' => $cityName]);
                        $cityId = $city->id;
                    }

                    // Create supplier
                    Supplier::create([
                        'name' => $name,
                        'address' => $address ?: null,
                        'city_id' => $cityId,
                        'phone_number' => $phoneNumber ?: null,
                        'contact_person' => $contactPerson ?: null,
                    ]);

                    $successCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $errors[] = "Row " . ($rowIndex + 1) . ": " . $e->getMessage();
                    Log::error('Import Supplier Error', [
                        'row' => $rowIndex + 1,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            $message = "Import berhasil: {$successCount} supplier berhasil diimport";
            if ($errorCount > 0) {
                $message .= ", {$errorCount} supplier gagal";
            }

            return redirect()->route('suppliers.index')
                ->with('success', $message)
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Import Supplier Failed', ['error' => $e->getMessage()]);
            
            return redirect()->back()
                ->with('error', 'Import gagal: ' . $e->getMessage());
        }
    }
}
