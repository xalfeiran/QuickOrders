<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

// Loose shape; contents are validated in InventoryService against the
// business's ingredients and the item's options.
//   base: [{ ingredientId, quantity }]
//   options: [{ groupId, optionId, components: [{ ingredientId, quantity }] }]
class RecipeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'base' => ['nullable', 'array'],
            'options' => ['nullable', 'array'],
        ];
    }
}
