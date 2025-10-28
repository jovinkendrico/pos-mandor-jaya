<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCashFlowRequest extends FormRequest
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
            'type' => 'required|in:in,out',
            'category_id' => 'required|exists:categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'required|string|max:1000',
            'bank_id' => 'required|exists:banks,id',
            'transaction_date' => 'required|date',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'type.required' => 'Cash flow type is required',
            'type.in' => 'Cash flow type must be either in or out',
            'category_id.required' => 'Category is required',
            'category_id.exists' => 'The selected category does not exist',
            'amount.required' => 'Amount is required',
            'amount.numeric' => 'Amount must be a number',
            'amount.min' => 'Amount must be at least 0',
            'description.required' => 'Description is required',
            'description.max' => 'Description cannot exceed 1000 characters',
            'bank_id.required' => 'Bank is required',
            'bank_id.exists' => 'The selected bank does not exist',
            'transaction_date.required' => 'Transaction date is required',
            'transaction_date.date' => 'Transaction date must be a valid date',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate that category type matches cash flow type
            if ($this->has('category_id') && $this->has('type')) {
                $this->validateCategoryType($validator);
            }
        });
    }

    /**
     * Validate that category type matches cash flow type
     */
    private function validateCategoryType($validator): void
    {
        $category = \App\Models\Category::find($this->input('category_id'));
        $cashFlowType = $this->input('type');

        if ($category) {
            if ($cashFlowType === 'in' && $category->type !== 'income') {
                $validator->errors()->add(
                    'category_id',
                    'Income categories can only be used for cash in transactions'
                );
            }

            if ($cashFlowType === 'out' && $category->type !== 'expense') {
                $validator->errors()->add(
                    'category_id',
                    'Expense categories can only be used for cash out transactions'
                );
            }
        }
    }
}
