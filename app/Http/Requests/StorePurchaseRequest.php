<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePurchaseRequest extends FormRequest
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
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'purchase_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:purchase_date'],
            'discount1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount2_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'ppn_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'details' => ['required', 'array', 'min:1'],
            'details.*.item_id' => ['required', 'exists:items,id'],
            'details.*.item_uom_id' => ['required', 'exists:item_uoms,id'],
            'details.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'details.*.price' => ['required', 'numeric', 'min:0'],
            'details.*.discount1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'details.*.discount2_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
