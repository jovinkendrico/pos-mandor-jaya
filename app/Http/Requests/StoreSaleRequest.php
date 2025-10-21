<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
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
            'customer_id' => ['nullable', 'exists:customers,id'],
            'sale_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:sale_date'],
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
