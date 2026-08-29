<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Customer;
use App\Support\PhoneNormalizer;

class CustomerService
{
    // Creates the customer if new (or updates their name), and records the
    // delivery address for next time. Called when an order is placed.
    //
    // $address, when present, has keys: street, exteriorNumber,
    // interiorNumber, neighborhood, city, postalCode, references.
    public function upsertWithAddress(string $phone, ?string $name, ?array $address): Customer
    {
        $normalized = PhoneNormalizer::normalize($phone);

        $customer = Customer::where('phone', $normalized)->first();
        if (! $customer) {
            $customer = Customer::create(['phone' => $normalized, 'name' => $name]);
        } elseif ($name) {
            $customer->update(['name' => $name]);
        }

        if ($address) {
            Address::create([
                'customer_id' => $customer->id,
                'street' => $address['street'],
                'exterior_number' => $address['exteriorNumber'],
                'interior_number' => $address['interiorNumber'] ?? null,
                'neighborhood' => $address['neighborhood'],
                'city' => $address['city'],
                'postal_code' => $address['postalCode'],
                'references' => $address['references'] ?? null,
                'last_used_at' => now(),
            ]);
        }

        return $customer;
    }

    // Returns the customer and their most recently used address, or null if
    // the number isn't registered. Used by the (verification-gated) lookup
    // endpoint.
    public function findByPhone(string $rawPhone): ?array
    {
        $phone = PhoneNormalizer::normalize($rawPhone);
        $customer = Customer::where('phone', $phone)->first();
        if (! $customer) {
            return null;
        }

        $lastAddress = Address::where('customer_id', $customer->id)
            ->orderByDesc('last_used_at')
            ->first();

        return ['customer' => $customer, 'lastAddress' => $lastAddress];
    }
}
