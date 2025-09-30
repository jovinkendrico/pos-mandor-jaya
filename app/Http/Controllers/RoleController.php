<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Redirect;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // 
        $roles = Role::with('permissions:id,name,group')->latest()->get();
        
        return Inertia::render('roles/index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
        $permissions = Permission::all();
        $groupedPermissions = $permissions->groupBy('group');
        
        return Inertia::render('roles/create', [
            'permissions' => $permissions,
            'groupedPermissions' => $groupedPermissions,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRoleRequest $storeRoleRequest)
    {
        DB::beginTransaction();

        try {
            $data = $storeRoleRequest->validated();

            $role = Role::create([
                'name' => $data['name'],
                'guard_name' => $data['guard_name'] ?? 'web',
            ]);

            $permissionIds = isset($data['permissions_ids']) && is_array($data['permissions_ids']) ? $data['permissions_ids'] : [];
            $role->permissions()->sync($permissionIds);

            DB::commit();

            return redirect()->route('roles.index')->with('success', 'Role created successfully');
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
        $role = Role::with('permissions:id,name,group')->findOrFail($id);
        $permissions = Permission::all();

        $groupedPermissions = $permissions->groupBy('group');
        
        return Inertia::render('roles/edit', [
            'role' => $role,
            'permissions' => $permissions,
            'groupedPermissions' => $groupedPermissions,
            'selected_permission_ids' => $role->permissions->pluck('id')->toArray(), // Ensure it's an array
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoleRequest $request, Role $role)
    {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $role->update([
                'name' => $data['name'],
                'guard_name' => $data['guard_name'] ?? $role->guard_name,
            ]);


            
            $permissionIds = isset($data['permissions_ids']) && is_array($data['permissions_ids']) ? $data['permissions_ids'] : [];
            $role->permissions()->sync($permissionIds);

            DB::commit();

            return redirect()->route('roles.index')->with('success', 'Role berhasil diupdate');
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }
    
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        DB::beginTransaction();
        try {
            $role->delete();

            DB::commit();

            return redirect()->route("roles.index")->with('success', 'Role deleted successfully');
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }
}