<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateStockMovementRequest extends FormRequest
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
            'item_id'            => ['required', 'exists:items,id'],
            'reference_type'     => ['nullable', 'string', 'max:255'],
            'reference_id'       => ['nullable', 'integer'],
            'quantity'           => ['required', 'numeric'],
            'unit_cost'          => ['required', 'numeric', 'min:0'],
            'remaining_quantity' => ['nullable', 'numeric'],
            'movement_date'      => ['required', 'date'],
            'notes'              => ['nullable', 'string'],
        ];
    }
}
