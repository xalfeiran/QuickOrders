<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Body for POST /api/verify/confirm.
class ConfirmVerificationCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'min:7'],
            // Exactly six digits.
            'code' => ['required', 'string', 'regex:/^\d{6}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'code must be 6 digits',
        ];
    }
}
