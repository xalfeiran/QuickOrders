<?php

namespace App\Support;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

// Validates admin-entered option groups and fills in any missing ids
// (derived from names). Enforces the same invariants the customer flow
// relies on: unique ids, 1+ options, 0 <= min <= max <= option count.
class MenuOptionGroupNormalizer
{
    // Turns a name into a url-safe id: lowercase, accent-stripped, dashed.
    public static function slugify(?string $input): string
    {
        $ascii = str_replace(
            ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'],
            ['a', 'e', 'i', 'o', 'u', 'n', 'u'],
            mb_strtolower($input ?? '')
        );
        $base = preg_replace('/[^a-z0-9]+/', '-', $ascii);
        $base = trim($base, '-');
        $base = mb_substr($base, 0, 48);

        return $base !== '' ? $base : 'item';
    }

    // Ensures a candidate id is unique within a set, appending -2, -3, … if needed.
    private static function uniqueId(string $candidate, array &$taken): string
    {
        $id = $candidate;
        $n = 2;
        while (in_array($id, $taken, true)) {
            $id = "{$candidate}-{$n}";
            $n++;
        }
        $taken[] = $id;

        return $id;
    }

    public static function normalize(mixed $input): array
    {
        if ($input === null) {
            return [];
        }
        if (! is_array($input)) {
            throw new BadRequestHttpException('optionGroups debe ser una lista');
        }

        $groupIds = [];

        return array_values(array_map(function ($g) use (&$groupIds) {
            $g = (array) $g;
            $name = is_string($g['name'] ?? null) ? trim($g['name']) : '';
            if ($name === '') {
                throw new BadRequestHttpException('Cada grupo necesita un nombre');
            }

            $id = self::uniqueId(
                (is_string($g['id'] ?? null) && $g['id'] !== '') ? $g['id'] : self::slugify($name),
                $groupIds
            );
            $min = (int) ($g['min'] ?? 0);
            $max = (int) ($g['max'] ?? 0);
            $required = (bool) ($g['required'] ?? false);

            $rawOptions = is_array($g['options'] ?? null) ? $g['options'] : [];
            if (count($rawOptions) === 0) {
                throw new BadRequestHttpException("El grupo \"{$name}\" necesita opciones");
            }

            $optionIds = [];
            $options = array_values(array_map(function ($o) use (&$optionIds, $name) {
                $o = (array) $o;
                $optName = is_string($o['name'] ?? null) ? trim($o['name']) : '';
                if ($optName === '') {
                    throw new BadRequestHttpException("Una opción de \"{$name}\" no tiene nombre");
                }

                return [
                    'id' => self::uniqueId(
                        (is_string($o['id'] ?? null) && $o['id'] !== '') ? $o['id'] : self::slugify($optName),
                        $optionIds
                    ),
                    'name' => $optName,
                    'priceDeltaCents' => (int) round((float) ($o['priceDeltaCents'] ?? 0)),
                ];
            }, $rawOptions));

            if ($min < 0 || $max < 1 || $min > $max) {
                throw new BadRequestHttpException("Rango min/max inválido en \"{$name}\"");
            }
            if ($max > count($options)) {
                throw new BadRequestHttpException("El máximo de \"{$name}\" excede el número de opciones");
            }

            return [
                'id' => $id,
                'name' => $name,
                'required' => $required,
                'min' => $min,
                'max' => $max,
                'options' => $options,
            ];
        }, $input));
    }
}
