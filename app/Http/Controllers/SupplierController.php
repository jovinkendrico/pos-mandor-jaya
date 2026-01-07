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
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = Supplier::with('city');

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhereHas('city', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by city
        if ($request->has('city_id') && $request->city_id) {
            $query->where('city_id', $request->city_id);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['name', 'phone_number'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } elseif ($sortBy === 'city') {
            $query->join('cities', 'suppliers.city_id', '=', 'cities.id')
                ->orderBy('cities.name', $sortOrder)
                ->select('suppliers.*')
                ->groupBy('suppliers.id');
        } else {
            $query->orderBy('name', 'asc');
        }
        $query->orderBy('id', 'asc');

        $suppliers = $query->paginate(10)->withQueryString();

        // Get all cities for filter
        $cities = City::orderBy('name')->get(['id', 'name']);

        return Inertia::render('master/supplier/index', [
            'suppliers' => $suppliers,
            'cities' => $cities,
            'filters' => [
                'search' => $request->get('search', ''),
                'city_id' => $request->get('city_id', ''),
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Search suppliers for autocomplete
     */
    public function search(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = Supplier::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
        }

        $suppliers = $query->limit(20)->get()->map(function ($supplier) {
            return [
                'value' => $supplier->id,
                'label' => $supplier->name,
                'supplier' => $supplier, // Return full object if needed
            ];
        });

        return response()->json([
            'data' => $suppliers
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

        return redirect()->back()
            ->with('success', 'Supplier berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();

        return redirect()->back()
            ->with('success', 'Supplier berhasil dihapus.');
    }
}
