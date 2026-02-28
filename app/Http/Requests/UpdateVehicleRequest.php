<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'police_number' => ['required', 'string', 'max:50', Rule::unique('vehicles')->ignore($this->vehicle)],
            'name'          => ['nullable', 'string', 'max:255'],
            'driver'        => ['nullable', 'string', 'max:255'],
            'is_active'     => ['sometimes', 'boolean'],
            'description'   => ['nullable', 'string'],
        ];
    }
}
