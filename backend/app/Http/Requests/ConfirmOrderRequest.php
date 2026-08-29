<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

// The full order payload submitted at the end of checkout. Prices are NOT
// accepted from the client — they're computed on the server from the live
// menu (see App\Services\OrderPricer).
class ConfirmOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'orderToken' => ['required', 'string'],
            // Present when ordering from a manager-generated link; consumed
            // on placement.
            'managedSessionToken' => ['nullable', 'string'],
            // Must match the verification grant in the request header.
            'phone' => ['required', 'string', 'min:7'],
            'customerName' => ['required', 'string', 'min:2'],
            'fulfillmentType' => ['required', 'in:pickup,delivery'],
            'paymentMethod' => ['required', 'in:cash,card'],

            'address' => ['nullable', 'array'],
            'address.street' => ['required_with:address', 'string', 'min:2'],
            'address.exteriorNumber' => ['required_with:address', 'string', 'min:1'],
            'address.interiorNumber' => ['nullable', 'string'],
            'address.neighborhood' => ['required_with:address', 'string', 'min:2'],
            'address.city' => ['required_with:address', 'string', 'min:2'],
            'address.postalCode' => ['required_with:address', 'string', 'min:3'],
            'address.references' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.menuItemId' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.selectedOptions' => ['nullable', 'array'],
            'items.*.selectedOptions.*.groupId' => ['required', 'string'],
            'items.*.selectedOptions.*.optionId' => ['required', 'string'],
        ];
    }
}
