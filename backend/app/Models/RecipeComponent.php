<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// One line of a menu item's recipe: how much of an ingredient is consumed,
// either by the base item (scope 'base') or by a specific option (scope
// 'option', identified by its group + option id within the item).
class RecipeComponent extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'business_id', 'menu_item_id', 'scope', 'option_group_id',
        'option_id', 'ingredient_id', 'quantity',
    ];

    protected $casts = [
        'quantity' => 'float',
        'created_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
