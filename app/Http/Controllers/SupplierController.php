<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSupplierRequest;
use App\Http\Requests\UpdateSupplierRequest;
use App\Models\Supplier;
use App\Models\City;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $suppliers = Supplier::with('city')
            ->orderBy('name')
            ->paginate(10);

        // Only send first 10 cities for initial load
        $cities = City::orderBy('name')->limit(10)->get();

        return Inertia::render('master/supplier/index', [
            'suppliers' => $suppliers,
            'cities' => $cities,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return response()->noContent();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSupplierRequest $request): RedirectResponse|JsonResponse
    {
        $supplier = Supplier::create($request->validated());

        // If AJAX request, return JSON
        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Supplier berhasil ditambahkan.',
                'data'    => $supplier,
            ], 201);
        }

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Supplier $supplier): Response
    {
        return response()->noContent();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Supplier $supplier): Response
    {
        return response()->noContent();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->route('suppliers.index')
            ->with('success', 'Supplier berhasil dihapus.');
    }
}
