<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Body for POST /api/verify/request.
class RequestVerificationCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'min:7'],
        ];
    }
}
