<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreSalePaymentRequest extends FormRequest
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
            'total_amount' => ['required', 'numeric', 'min:0.01'], // Total cash received from customer
            'items' => ['required', 'array', 'min:1'],
            'items.*.sale_id' => ['required', 'exists:sales,id'],
            'items.*.amount' => ['required', 'numeric', 'min:0.01'],
            'bank_id' => ['nullable', 'exists:banks,id'],
            'payment_method' => ['required', 'in:cash,transfer,giro,cek,other'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,confirmed'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $totalReceived = $this->total_amount ?? 0;
            $totalAllocated = collect($this->items ?? [])->sum('amount');
            
            // Validate total allocated doesn't exceed total received
            if ($totalAllocated > $totalReceived) {
                $validator->errors()->add('total_amount', 
                    'Total alokasi (' . number_format($totalAllocated, 0, ',', '.') . 
                    ') tidak boleh melebihi total pembayaran diterima (' . 
                    number_format($totalReceived, 0, ',', '.') . ')');
            }
            
            // Validate each allocation doesn't exceed invoice remaining amount
            foreach ($this->items ?? [] as $index => $item) {
                $sale = \App\Models\Sale::find($item['sale_id']);
                if ($sale) {
                    $sale->append(['total_paid', 'remaining_amount']);
                    if ($item['amount'] > $sale->remaining_amount) {
                        $validator->errors()->add("items.{$index}.amount", 
                            'Jumlah alokasi (' . number_format($item['amount'], 0, ',', '.') . 
                            ') melebihi sisa piutang invoice (' . 
                            number_format($sale->remaining_amount, 0, ',', '.') . ')');
                    }
                }
            }
        });
    }
}
