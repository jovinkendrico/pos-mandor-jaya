<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVehicleRequest;
use App\Http\Requests\UpdateVehicleRequest;
use App\Models\Vehicle;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class VehicleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = Vehicle::query();

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('police_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('driver', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy    = $request->get('sort_by', 'police_number');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['police_number', 'name', 'driver', 'is_active'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('police_number', 'asc');
        }
        $query->orderBy('id', 'asc');

        $vehicles = $query->paginate(10)->withQueryString();

        return Inertia::render('master/vehicle/index', [
            'vehicles' => $vehicles,
            'filters'  => [
                'search'     => $request->get('search', ''),
                'sort_by'    => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Search vehicles for autocomplete
     */
    public function search(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = Vehicle::where('is_active', true);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('police_number', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $vehicles = $query->limit(20)->get()->map(function ($vehicle) {
            return [
                'value' => $vehicle->id,
                'label' => $vehicle->police_number . ($vehicle->name ? " - {$vehicle->name}" : ""),
                'vehicle' => $vehicle,
            ];
        });

        return response()->json([
            'data' => $vehicles
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
    public function store(StoreVehicleRequest $request): RedirectResponse
    {
        Vehicle::create($request->validated());

        return redirect()->route('vehicles.index')
            ->with('success', 'Kendaraan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Vehicle $vehicle): Response
    {
        return response()->noContent();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Vehicle $vehicle): Response
    {
        return response()->noContent();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): RedirectResponse
    {
        $vehicle->update($request->validated());

        return redirect()->back()
            ->with('success', 'Kendaraan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Vehicle $vehicle): RedirectResponse
    {
        $vehicle->delete();

        return redirect()->back()
            ->with('success', 'Kendaraan berhasil dihapus.');
    }
}
