<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;

class Member extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'name',
        'phone_number',
        'notes',
        'created_by',
        'updated_by',
    ];

    public function loans(): HasMany
    {
        return $this->hasMany(MemberLoan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
