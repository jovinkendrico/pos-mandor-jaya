<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCityRequest;
use App\Http\Requests\UpdateCityRequest;
use App\Models\City;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CityController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response|JsonResponse
    {
        // If has 'limit' parameter, it's an AJAX request for loading cities
        if ($request->has('limit')) {
            $limit  = $request->get('limit', 10);
            $cities = City::orderBy('name')->limit($limit)->get();
            return response()->json([
                'data' => $cities,
            ]);
        }

        // Otherwise, return Inertia page
        $query = City::query();

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        // Sorting
        $sortBy    = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['name'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('name', 'asc');
        }
        $query->orderBy('id', 'asc');

        $cities = $query->paginate(10)->withQueryString();

        return Inertia::render('master/city/index', [
            'cities'  => $cities,
            'filters' => [
                'search'     => $request->get('search', ''),
                'sort_by'    => $sortBy,
                'sort_order' => $sortOrder,
            ],
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
    public function store(StoreCityRequest $request): RedirectResponse|JsonResponse
    {
        $city = City::create($request->validated());

        return redirect()->back()
            ->with('success', 'Kota berhasil ditambahkan.');
    }


    /**
     * Search cities for autocomplete
     */
    public function search(Request $request): JsonResponse
    {
        $search = $request->get('search', '');
        $limit  = $request->get('limit');

        $cities = City::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%');
            })
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(function ($city) {
                return [
                    'value' => (string) $city->id,
                    'label' => $city->name,
                ];
            });

        return response()->json([
            'data' => $cities,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(City $city): Response
    {
        return response()->noContent();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(City $city): Response
    {
        return response()->noContent();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCityRequest $request, City $city): RedirectResponse
    {
        $city->update($request->validated());

        return redirect()->back()
            ->with('success', 'Kota berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(City $city): RedirectResponse
    {
        $city->delete();

        return redirect()->route('cities.index')
            ->with('success', 'Kota berhasil dihapus.');
    }
}
