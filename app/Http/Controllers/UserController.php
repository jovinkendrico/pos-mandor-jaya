<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Redirect;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Eager load roles for each user
        $users = User::with('roles')->get();
        
        return Inertia::render("users/index", [
            "users" => $users,
            "roles" => Role::all(),
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateUserRequest $request)
    {
        DB::beginTransaction();
        try {
            // Create the user
            $userData = $request->validated();
            unset($userData['roles']);
            $user = User::create($userData);
            
            if ($request->has('roles') && is_array($request->roles)) {
                $roleIds = $request->roles;
                $roles = Role::whereIn('id', $roleIds)->get();
                $user->syncRoles($roles);
            }

            DB::commit();
            return back()->with('success', 'User berhasil ditambahkan');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        DB::beginTransaction();
        try {
            $validatedData = $request->validated();
            
            $userData = $request->only(['name', 'email']);
            $user->update($userData);
            
            if ($request->filled('password')) {
                $user->update(['password' => bcrypt($request->password)]);
            }
            
            if ($request->has('roles') && is_array($request->roles)) {
                $roleIds = $request->roles;
                $roles = Role::whereIn('id', $roleIds)->get();
                $user->syncRoles($roles);
            }

            DB::commit();
            return back()->with('success', 'User berhasil diupdate');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return Redirect::back()->with('success', 'User deleted successfully.');
    }
}