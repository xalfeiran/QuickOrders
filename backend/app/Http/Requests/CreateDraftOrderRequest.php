<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Body for POST /api/orders/draft. The business is optional — when omitted
// the draft is created for the default business (legacy single-tenant entry).
class CreateDraftOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'businessSlug' => ['nullable', 'string'],
        ];
    }
}
