<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
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
            'reference_type' => 'required|in:Purchase,Sale',
            'reference_id' => 'required|integer|exists:' . $this->getReferenceTable() . ',id',
            'payment_date' => 'required|date',
            'amount_paid' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,bank_transfer,check,other',
            'bank_id' => 'nullable|exists:banks,id',
            'notes' => 'nullable|string|max:1000',
            'payment_details' => 'array',
            'payment_details.*.amount' => 'required|numeric|min:0',
            'payment_details.*.payment_date' => 'required|date',
            'payment_details.*.payment_method' => 'required|in:cash,bank_transfer,check,other',
            'payment_details.*.bank_id' => 'nullable|exists:banks,id',
            'payment_details.*.notes' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'reference_type.required' => 'Reference type is required',
            'reference_type.in' => 'Reference type must be either Purchase or Sale',
            'reference_id.required' => 'Reference ID is required',
            'reference_id.exists' => 'The selected transaction does not exist',
            'payment_date.required' => 'Payment date is required',
            'payment_date.date' => 'Payment date must be a valid date',
            'amount_paid.required' => 'Amount paid is required',
            'amount_paid.numeric' => 'Amount paid must be a number',
            'amount_paid.min' => 'Amount paid must be at least 0',
            'payment_method.required' => 'Payment method is required',
            'payment_method.in' => 'Payment method must be one of: cash, bank_transfer, check, other',
            'bank_id.exists' => 'The selected bank does not exist',
            'notes.max' => 'Notes cannot exceed 1000 characters',
        ];
    }

    /**
     * Get the reference table name based on reference type
     */
    private function getReferenceTable(): string
    {
        return $this->input('reference_type') === 'Purchase' ? 'purchases' : 'sales';
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate that the total amount doesn't exceed the transaction total
            if ($this->has('reference_type') && $this->has('reference_id')) {
                $this->validatePaymentAmount($validator);
            }
        });
    }

    /**
     * Validate that payment amount doesn't exceed transaction total
     */
    private function validatePaymentAmount($validator): void
    {
        $referenceType = $this->input('reference_type');
        $referenceId = $this->input('reference_id');
        $amountPaid = $this->input('amount_paid', 0);

        if ($referenceType === 'Purchase') {
            $transaction = \App\Models\Purchase::find($referenceId);
        } else {
            $transaction = \App\Models\Sale::find($referenceId);
        }

        if ($transaction) {
            $totalPaid = \App\Models\Payment::getTotalPaid($referenceType, $referenceId);
            $remainingAmount = $transaction->total_amount - $totalPaid;

            if ($amountPaid > $remainingAmount) {
                $validator->errors()->add(
                    'amount_paid',
                    "Payment amount cannot exceed remaining amount of {$remainingAmount}"
                );
            }
        }
    }
}
