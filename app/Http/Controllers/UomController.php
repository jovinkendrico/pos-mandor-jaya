<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUomRequest;
use App\Http\Requests\UpdateUomRequest;
use App\Models\Uom;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UomController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
        $uoms = Uom::orderBy('name')->get()->paginate(10);

        return Inertia::render('master/uom/index', [
            'uoms' => $uoms,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        return response()->noContent();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUomRequest $request)
    {
        //
        Uom::create($request->validated());
        return redirect()->back()
            ->with('success', 'UOM berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        return response()->noContent();
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
        return response()->noContent();
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUomRequest $request, Uom $uom)
    {
        //
        $uom->update($request->validated());
        return redirect()->route('uoms.index')
            ->with('success', 'UOM berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Uom $uom)
    {
        //
        $uom->delete();

        return redirect()->route('uoms.index')
            ->with('success', 'Uom berhasil dihapus.');
    }


}
