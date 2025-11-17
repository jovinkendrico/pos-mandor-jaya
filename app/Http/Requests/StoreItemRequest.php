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
            'modal_price'                          => ['nullable', 'numeric', 'min:0'],
            'description'                          => ['nullable', 'string'],
            'uoms'                                 => ['required', 'array', 'min:1'],
            'uoms.*.uom_id'                        => ['required', 'exists:uoms,id'],
            'uoms.*.conversion_value'              => ['required', 'integer', 'min:1'],
            'uoms.*.price'                         => ['required', 'numeric', 'min:0'],
            'uoms.*.is_base'                       => ['boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $uoms = $this->input('uoms', []);
            $baseCount = collect($uoms)->where('is_base', true)->count();

            if ($baseCount !== 1) {
                $validator->errors()->add('uoms', 'Harus ada tepat satu UOM sebagai base.');
            }

            $stock = (float) ($this->input('stock') ?? 0);
            if ($stock > 0 && $this->filled('modal_price') === false) {
                $validator->errors()->add('modal_price', 'Harga modal wajib diisi ketika stok awal lebih dari 0.');
            }
        });
    }
}
