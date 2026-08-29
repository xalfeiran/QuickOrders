<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Body for POST /api/auth/login.
class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'min:3'],
            'password' => ['required', 'string', 'min:1'],
        ];
    }
}
