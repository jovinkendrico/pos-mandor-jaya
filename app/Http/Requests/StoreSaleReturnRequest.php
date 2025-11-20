<?php

namespace App\Http\Requests;

use App\Models\SaleDetail;
use App\Models\SaleReturnDetail;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Validator;

class StoreSaleReturnRequest extends FormRequest
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
            'sale_id' => 'required|exists:sales,id',
            'return_date' => 'required|date',
            'return_type' => 'required|in:stock_only,stock_and_refund',
            'refund_bank_id' => 'nullable|exists:banks,id',
            'refund_method' => 'nullable|in:reduce_receivable,cash_refund',
            'ppn_percent' => 'nullable|numeric|min:0|max:100',
            'reason' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.sale_detail_id' => 'nullable|exists:sale_details,id',
            'details.*.item_id' => 'required|exists:items,id',
            'details.*.item_uom_id' => 'required|exists:item_uoms,id',
            'details.*.quantity' => 'required|numeric|min:0.01',
            'details.*.price' => 'required|numeric|min:0',
            'details.*.discount1_percent' => 'nullable|numeric|min:0|max:100',
            'details.*.discount2_percent' => 'nullable|numeric|min:0|max:100',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            // Validate refund_method and refund_bank_id
            if ($this->return_type === 'stock_and_refund') {
                if (!$this->refund_method) {
                    $validator->errors()->add('refund_method', 'Metode refund harus dipilih untuk retur dengan refund.');
                } elseif ($this->refund_method === 'cash_refund' && !$this->refund_bank_id) {
                    $validator->errors()->add('refund_bank_id', 'Bank harus dipilih untuk cash refund.');
                }
            }

            if (!$this->has('details') || !is_array($this->details)) {
                return;
            }

            foreach ($this->details as $index => $detail) {
                // Skip validation if sale_detail_id is not provided
                if (empty($detail['sale_detail_id'])) {
                    continue;
                }

                $saleDetailId = $detail['sale_detail_id'];
                $returnQuantity = (float) ($detail['quantity'] ?? 0);

                if ($returnQuantity <= 0) {
                    continue;
                }

                // Get the original sale detail
                $saleDetail = SaleDetail::find($saleDetailId);
                if (!$saleDetail) {
                    continue;
                }

                // Calculate total already returned quantity for this sale_detail_id
                $totalReturned = SaleReturnDetail::where('sale_detail_id', $saleDetailId)
                    ->whereHas('saleReturn', function ($query) {
                        $query->where('status', 'confirmed');
                    })
                    ->sum('quantity');

                // Get the original quantity from sale detail
                $originalQuantity = (float) $saleDetail->quantity;

                // Calculate remaining quantity that can be returned
                $remainingQuantity = $originalQuantity - $totalReturned;

                // Check if already fully returned
                if ($remainingQuantity <= 0) {
                    $validator->errors()->add(
                        "details.{$index}.sale_detail_id",
                        "Item ini sudah pernah direfund sepenuhnya dan tidak dapat direfund lagi."
                    );
                    continue;
                }

                // Check if trying to return more than remaining
                if ($returnQuantity > $remainingQuantity) {
                    $validator->errors()->add(
                        "details.{$index}.quantity",
                        "Item ini sudah pernah direfund. Sisa yang bisa direfund: {$remainingQuantity}. Anda mencoba refund: {$returnQuantity}"
                    );
                }
            }
        });
    }
}
