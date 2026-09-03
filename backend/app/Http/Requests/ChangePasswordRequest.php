<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// Body for PUT /api/auth/password. The current password is required even
// though the request already carries a valid session cookie — that way a
// phone left unlocked, or a stolen session cookie, still can't be used to
// lock the real owner out of their account.
class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:8', 'different:currentPassword'],
        ];
    }

    public function attributes(): array
    {
        return [
            'currentPassword' => 'current password',
            'newPassword' => 'new password',
        ];
    }

    public function messages(): array
    {
        return [
            'newPassword.different' => 'The new password must be different from the current password.',
        ];
    }
}
