<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePermissionRequest;
use App\Http\Requests\UpdatePermissionRequest;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $permissions = Permission::all();
        
        $groupedPermissions = $permissions->groupBy('group');
        
        return Inertia::render('permissions/index', [
            'permissions' => $groupedPermissions,
            'ungroupedPermissions' => $permissions->whereNull('group'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePermissionRequest $storePermissionRequest)
    {
        DB::beginTransaction();
        try {
            Permission::create($storePermissionRequest->validated());

            DB::commit();
            return back()->with('success', 'Permission berhasil ditambahkan');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        $permission = Permission::findOrFail($id);
        return Inertia::render('permissions/show', [
            'permission' => $permission,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePermissionRequest $updatePermissionRequest, string $id)
    {
        $permission = Permission::findOrFail($id);

        $permission->update($updatePermissionRequest->validated());

        return redirect()->route('permissions.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
        $permission = Permission::find($id);
        $permission->delete();
        return redirect()->route('permissions.index');
    }
}