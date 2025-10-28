<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
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
            'name' => 'required|string|max:255|unique:categories,name',
            'type' => 'required|in:income,expense',
            'parent_id' => 'nullable|exists:categories,id',
            'description' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Category name is required',
            'name.unique' => 'Category name already exists',
            'name.max' => 'Category name cannot exceed 255 characters',
            'type.required' => 'Category type is required',
            'type.in' => 'Category type must be either income or expense',
            'parent_id.exists' => 'The selected parent category does not exist',
            'description.max' => 'Description cannot exceed 1000 characters',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate that parent category has the same type
            if ($this->has('parent_id') && $this->has('type')) {
                $this->validateParentCategoryType($validator);
            }
        });
    }

    /**
     * Validate that parent category has the same type
     */
    private function validateParentCategoryType($validator): void
    {
        $parentId = $this->input('parent_id');
        $categoryType = $this->input('type');

        if ($parentId) {
            $parentCategory = \App\Models\Category::find($parentId);

            if ($parentCategory && $parentCategory->type !== $categoryType) {
                $validator->errors()->add(
                    'parent_id',
                    'Parent category must have the same type as the new category'
                );
            }
        }
    }
}
