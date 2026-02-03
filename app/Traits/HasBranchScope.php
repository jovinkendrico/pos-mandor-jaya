<?php

namespace App\Traits;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait HasBranchScope
{
    /**
     * Boot the trait.
     */
    protected static function bootHasBranchScope(): void
    {
        // Apply Global Scope to filter by current user's branch
        // Apply Global Scope to filter by current user's branch
        static::addGlobalScope('branch', function (Builder $builder) {
            if (auth()->check() && auth()->user()->branch_id) {
                // If user is from Head Office, they can see everything (Scope not applied)
                // We need to load branch relationship or check cached user branch details
                // Ideally, user model should have relation loaded or we query. 
                // To avoid N+1 every query, we assume relation attached or we query simplified.
                // Or better, we trust the `is_head_office` on the user's branch relation if loaded, 
                // or we join/query efficiently. 
                
                // For performance and reliability in traits:
                $user = auth()->user();
                
                // If relation not loaded, this might cause extra query per model boot, which is okay for now.
                // Optimization: Cache this on the request or session.
                if ($user->branch && $user->branch->is_head_office) {
                     return;
                }

                $builder->where($builder->getModel()->qualifyColumn('branch_id'), $user->branch_id);
            }
        });

        // Automatically set branch_id when creating
        static::creating(function ($model) {
            if (empty($model->branch_id) && auth()->check() && auth()->user()->branch_id) {
                $model->branch_id = auth()->user()->branch_id;
            }
        });
    }

    /**
     * Get the branch that owns the model.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
