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
            'name'                                 => ['required', 'string', 'max:255'],
            'stock'                                => ['nullable', 'numeric', 'min:0'],
            'description'                          => ['nullable', 'string'],
            'uoms'                                 => ['required', 'array', 'min:1'],
            'uoms.*.uom_id'                        => ['required', 'exists:uoms,id'],
            'uoms.*.conversion_value'              => ['required', 'integer', 'min:1'],
            'uoms.*.price'                         => ['required', 'numeric', 'min:0'],
            'uoms.*.is_base'                       => ['boolean'],
            'stock_movements'                      => ['array', 'min:1'],
            'stock_movements.*.remaining_quantity' => ['required'],
            'stock_movements.*.unit_cost'          => ['required'],
            'stock_movements.*.movement_date'      => ['required', 'date'],
            'stock_movements.*.notes'              => ['nullable', 'string'],
        ];
    }
}
