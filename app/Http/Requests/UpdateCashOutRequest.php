<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateCashOutRequest extends FormRequest
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
            'cash_out_date' => 'required|date',
            'bank_id' => 'required|exists:banks,id',
            'chart_of_account_id' => 'required|exists:chart_of_accounts,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
            'auto_post' => 'nullable|boolean',
        ];
    }
}
