<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateSaleRequest extends FormRequest
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
            'customer_id' => ['nullable', 'exists:customers,id'],
            'sale_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:sale_date'],
            'discount1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount2_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'ppn_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string'],
            'details' => ['required', 'array', 'min:1'],
            'details.*.item_id' => ['required', 'exists:items,id'],
            'details.*.item_uom_id' => ['required', 'exists:item_uoms,id'],
            'details.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'details.*.price' => ['required', 'numeric', 'min:0'],
            'details.*.discount1_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'details.*.discount2_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
