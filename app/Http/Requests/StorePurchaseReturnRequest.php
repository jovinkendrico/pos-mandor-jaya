<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePurchaseReturnRequest extends FormRequest
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
            'purchase_id' => 'required|exists:purchases,id',
            'return_date' => 'required|date',
            'ppn_percent' => 'nullable|numeric|min:0|max:100',
            'reason' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.purchase_detail_id' => 'nullable|exists:purchase_details,id',
            'details.*.item_id' => 'required|exists:items,id',
            'details.*.item_uom_id' => 'required|exists:item_uoms,id',
            'details.*.quantity' => 'required|numeric|min:0.01',
            'details.*.price' => 'required|numeric|min:0',
            'details.*.discount1_percent' => 'nullable|numeric|min:0|max:100',
            'details.*.discount2_percent' => 'nullable|numeric|min:0|max:100',
        ];
    }
}
