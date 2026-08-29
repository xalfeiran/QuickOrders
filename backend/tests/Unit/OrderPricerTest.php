<?php

use App\Services\OrderPricer;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

// Mirrors order-pricing.spec.ts from the old NestJS backend, case for case.
function pricerTestItem(): array
{
    return [
        'id' => 'burger',
        'name' => 'Burger',
        'description' => '',
        'priceCents' => 8900,
        'category' => 'Burgers',
        'available' => true,
        'optionGroups' => [
            [
                'id' => 'temp', 'name' => 'Temperature', 'required' => true, 'min' => 1, 'max' => 1,
                'options' => [
                    ['id' => 'medium', 'name' => 'Medium', 'priceDeltaCents' => 0],
                    ['id' => 'well', 'name' => 'Well-done', 'priceDeltaCents' => 0],
                ],
            ],
            [
                'id' => 'addons', 'name' => 'Add-ons', 'required' => false, 'min' => 0, 'max' => 2,
                'options' => [
                    ['id' => 'bacon', 'name' => 'Bacon', 'priceDeltaCents' => 1500],
                    ['id' => 'cheese', 'name' => 'Extra cheese', 'priceDeltaCents' => 1000],
                ],
            ],
        ],
    ];
}

it('adds option deltas and multiplies by quantity', function () {
    $line = OrderPricer::priceLine(
        pricerTestItem(),
        [['groupId' => 'temp', 'optionId' => 'medium'], ['groupId' => 'addons', 'optionId' => 'bacon']],
        2,
    );
    expect($line['unitPriceCents'])->toBe(10400); // 8900 + 1500
    expect($line['lineTotalCents'])->toBe(20800); // x2
    expect($line['selectedOptions'])->toHaveCount(2);
});

it('captures option names for display', function () {
    $line = OrderPricer::priceLine(pricerTestItem(), [['groupId' => 'temp', 'optionId' => 'well']], 1);
    expect($line['selectedOptions'][0]['groupName'])->toBe('Temperature');
    expect($line['selectedOptions'][0]['optionName'])->toBe('Well-done');
});

it('rejects a missing required group', function () {
    OrderPricer::priceLine(pricerTestItem(), [['groupId' => 'addons', 'optionId' => 'bacon']], 1);
})->throws(BadRequestHttpException::class);

it('rejects an unknown group', function () {
    OrderPricer::priceLine(
        pricerTestItem(),
        [['groupId' => 'temp', 'optionId' => 'medium'], ['groupId' => 'sauce', 'optionId' => 'bbq']],
        1,
    );
})->throws(BadRequestHttpException::class);

it('rejects an unknown option', function () {
    OrderPricer::priceLine(pricerTestItem(), [['groupId' => 'temp', 'optionId' => 'rare']], 1);
})->throws(BadRequestHttpException::class);

it('rejects exceeding a single-choice group', function () {
    OrderPricer::priceLine(
        pricerTestItem(),
        [['groupId' => 'temp', 'optionId' => 'medium'], ['groupId' => 'temp', 'optionId' => 'well']],
        1,
    );
})->throws(BadRequestHttpException::class);

it('rejects duplicate option picks', function () {
    OrderPricer::priceLine(
        pricerTestItem(),
        [
            ['groupId' => 'temp', 'optionId' => 'medium'],
            ['groupId' => 'addons', 'optionId' => 'bacon'],
            ['groupId' => 'addons', 'optionId' => 'bacon'],
        ],
        1,
    );
})->throws(BadRequestHttpException::class);
