<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name',
        'address',
        'city_id',
        'phone_number',
        'contact_person',
    ];

    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }
}
