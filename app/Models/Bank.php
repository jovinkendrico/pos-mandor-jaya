<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bank extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'account_number',
        'account_name',
        'balance',
        'description',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    public function cashFlows(): HasMany
    {
        return $this->hasMany(CashFlow::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
