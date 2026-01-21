<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePurchasePaymentRequest extends FormRequest
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
            'payment_date' => ['required', 'date'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_id' => ['required', 'exists:purchases,id'],
            'items.*.amount' => ['required', 'numeric', 'min:0.01'],
            'bank_id' => ['nullable', 'exists:banks,id'],
            'payment_method' => ['required', 'in:cash,transfer,giro,cek,other'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'transfer_fee' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,confirmed'],
        ];
    }
}
