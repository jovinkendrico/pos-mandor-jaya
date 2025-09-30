<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Tentukan apakah user berhak melakukan request ini.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Aturan validasi untuk request ini.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
{
    $roleId = $this->route('role') instanceof \App\Models\Role
        ? $this->route('role')->id
        : $this->route('role');

    return [
        'name' => [
            'required',
            'string',
            'max:255',
            Rule::unique('roles', 'name')->ignore($roleId),
        ],
        'guard_name' => ['required', 'string', 'in:web,api'],
        'permissions_ids' => ['nullable', 'array'],
        'permissions_ids.*' => ['integer', 'exists:permissions,id'],
    ];
}

    /**
     * Pesan error kustom dalam Bahasa Indonesia.
     */
    public function messages(): array
    {
        return [
            'name.required'      => 'Nama role wajib diisi.',
            'name.string'        => 'Nama role harus berupa teks.',
            'name.max'           => 'Nama role tidak boleh lebih dari :max karakter.',
            'name.unique'        => 'Nama role sudah digunakan.',

            'guard_name.required' => 'Guard wajib diisi.',
            'guard_name.string'   => 'Guard harus berupa teks.',
            'guard_name.in'       => 'Guard hanya boleh bernilai "web" atau "api".',

            'permissions_ids.array'      => 'Daftar permission harus berupa array.',
            'permissions_ids.*.integer'  => 'ID permission harus berupa angka.',
            'permissions_ids.*.exists'   => 'Permission dengan ID tersebut tidak ditemukan.',
        ];
    }
}
