<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Models\Customer;
use App\Models\City;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(\Illuminate\Http\Request $request): Response
    {
        $query = Customer::with('city');

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
        $sortBy    = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $allowedSortFields = ['name', 'phone_number'];
        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder);
        } elseif ($sortBy === 'city') {
            $query->join('cities', 'customers.city_id', '=', 'cities.id')
                ->orderBy('cities.name', $sortOrder)
                ->select('customers.*')
                ->groupBy('customers.id');
        } else {
            $query->orderBy('name', 'asc');
        }
        $query->orderBy('id', 'asc');

        $customers = $query->paginate(10)->withQueryString();

        $cities = City::orderBy('name')->get(['id', 'name']);

        return Inertia::render('master/customer/index', [
            'customers' => $customers,
            'cities'    => $cities,
            'filters'   => [
                'search'     => $request->get('search', ''),
                'city_id'    => $request->get('city_id', ''),
                'sort_by'    => $sortBy,
                'sort_order' => $sortOrder,
            ],
        ]);
    }

    /**
     * Search customers for autocomplete
     */
    public function search(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('phone_number', 'like', "%{$search}%");
        }

        $customers = $query->limit(20)->get()->map(function ($customer) {
            return [
                'value' => $customer->id,
                'label' => $customer->name,
                'customer' => $customer, // Return full object if needed
            ];
        });

        return response()->json([
            'data' => $customers
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
    public function store(StoreCustomerRequest $request): RedirectResponse|JsonResponse
    {
        $customer = Customer::create($request->validated());

        // // If AJAX request, return JSON
        // if ($request->wantsJson() || $request->ajax()) {
        //     return response()->json([
        //         'success' => true,
        //         'message' => 'Customer berhasil ditambahkan.',
        //         'data'    => $customer,
        //     ], 201);
        // }

        return redirect()->route('customers.index')
            ->with('success', 'Customer berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer): Response
    {
        return response()->noContent();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Customer $customer): Response
    {
        return response()->noContent();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());

        return redirect()->back()
            ->with('success', 'Customer berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        return redirect()->back()
            ->with('success', 'Customer berhasil dihapus.');
    }
}
