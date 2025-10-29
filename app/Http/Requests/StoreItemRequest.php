<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'stock' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'uoms' => ['required', 'array', 'min:1'],
            'uoms.*.uom_name' => ['required', 'string', 'max:255'],
            'uoms.*.conversion_value' => ['required', 'integer', 'min:1'],
            'uoms.*.price' => ['required', 'numeric', 'min:0'],
            'uoms.*.is_base' => ['boolean'],
        ];
    }
}
