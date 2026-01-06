<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StorePurchaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Normalize decimal separators (comma to dot)
        $this->merge([
            'discount1_percent' => $this->normalizeDecimal($this->discount1_percent),
            'discount2_percent' => $this->normalizeDecimal($this->discount2_percent),
            'discount3_percent' => $this->normalizeDecimal($this->discount3_percent),
            'discount4_percent' => $this->normalizeDecimal($this->discount4_percent),
            'ppn_percent' => $this->normalizeDecimal($this->ppn_percent),
        ]);

        // Normalize details array
        if ($this->has('details') && is_array($this->details)) {
            $details = $this->details;
            foreach ($details as $index => $detail) {
                $details[$index]['quantity'] = $this->normalizeDecimal($detail['quantity'] ?? null);
                $details[$index]['price'] = $this->normalizeDecimal($detail['price'] ?? null);
                $details[$index]['discount1_percent'] = $this->normalizeDecimal($detail['discount1_percent'] ?? null);
                $details[$index]['discount2_percent'] = $this->normalizeDecimal($detail['discount2_percent'] ?? null);
                $details[$index]['discount3_percent'] = $this->normalizeDecimal($detail['discount3_percent'] ?? null);
                $details[$index]['discount4_percent'] = $this->normalizeDecimal($detail['discount4_percent'] ?? null);
            }
            $this->merge(['details' => $details]);
        }
    }

    /**
     * Normalize decimal separator from comma to dot
     */
    private function normalizeDecimal($value)
    {
        if ($value === null || $value === '') {
            return $value;
        }

        // Convert to string and replace comma with dot
        $normalized = str_replace(',', '.', (string) $value);
        
        // Remove any thousand separators (dots before the last dot)
        $parts = explode('.', $normalized);
        if (count($parts) > 2) {
            // Multiple dots found, keep only the last one as decimal separator
            $decimal = array_pop($parts);
            $normalized = implode('', $parts) . '.' . $decimal;
        }

        return $normalized;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'purchase_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:purchase_date'],
            'discount1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount2_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount3_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount4_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'ppn_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'details' => ['required', 'array', 'min:1'],
            'details.*.item_id' => ['required', 'exists:items,id'],
            'details.*.item_uom_id' => [
                'required',
                'integer',
                'min:1',
                'exists:item_uoms,id',
                function ($attribute, $value, $fail) {
                    // Get the index from the attribute (e.g., "details.0.item_uom_id" -> 0)
                    $parts = explode('.', $attribute);
                    if (count($parts) < 3) {
                        return; // Invalid attribute format
                    }

                    $index = (int) $parts[1];
                    $itemId = request()->input("details.{$index}.item_id");

                    if ($itemId && $value) {
                        // Check if item_uom_id belongs to the item_id (including soft deleted)
                        $exists = \App\Models\ItemUom::withTrashed()
                            ->where('id', $value)
                            ->where('item_id', $itemId)
                            ->exists();

                        if (!$exists) {
                            $fail('UOM yang dipilih tidak valid untuk item ini.');
                        }
                    }
                },
            ],
            'details.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'details.*.price' => ['required', 'numeric', 'min:0'],
            'details.*.discount1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'details.*.discount2_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'details.*.discount3_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'details.*.discount4_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
