<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateItemRequest extends FormRequest
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
            'name'                    => ['required', 'string', 'max:255'],
            'description'             => ['nullable', 'string'],
            'uoms'                    => ['required', 'array', 'min:1'],
            'uoms.*.uom_id'           => ['required', 'exists:uoms,id'],
            'uoms.*.conversion_value' => ['required', 'numeric', 'min:1'],
            'uoms.*.price'            => ['required', 'numeric', 'min:0'],
            'uoms.*.is_base'          => ['boolean'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $uoms      = $this->input('uoms', []);
            $baseCount = collect($uoms)->where('is_base', true)->count();

            if ($baseCount !== 1) {
                $validator->errors()->add('uoms', 'Harus ada tepat satu UOM sebagai base.');
            }
        });
    }
}
