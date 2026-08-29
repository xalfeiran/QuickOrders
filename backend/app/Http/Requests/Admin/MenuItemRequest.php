<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

// Create/update payload for a menu item. optionGroups is validated and
// normalised in AdminMenuService (see App\Support\MenuOptionGroupNormalizer).
class MenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'min:2'],
            'priceCents' => ['required', 'integer', 'min:0'],
            'available' => ['nullable', 'boolean'],
            'sortOrder' => ['nullable', 'integer'],
            'optionGroups' => ['nullable', 'array'],
        ];
    }
}
