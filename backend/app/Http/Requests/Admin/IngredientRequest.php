<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class IngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2'],
            'unit' => ['required', 'in:gr,ml,pza'],
            'stockQty' => ['required', 'numeric', 'min:0'],
            'active' => ['nullable', 'boolean'],
        ];
    }
}
