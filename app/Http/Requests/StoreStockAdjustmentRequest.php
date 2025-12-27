<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockAdjustmentRequest extends FormRequest
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
            'item_id'         => 'required|exists:items,id',
            'quantity'        => 'required|numeric|not_in:0',
            'unit_cost'       => 'nullable|numeric|min:0',
            'adjustment_date' => 'required|date',
            'notes'           => 'nullable|string|max:500',
        ];
    }
}
