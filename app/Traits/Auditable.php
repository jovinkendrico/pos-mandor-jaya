<?php

namespace App\Traits;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            $model->logActivity('created');
        });

        static::updated(function ($model) {
            $model->logActivity('updated');
        });

        static::deleted(function ($model) {
            $model->logActivity('deleted');
        });
    }

    protected function logActivity(string $action)
    {
        $oldValues = null;
        $newValues = null;

        if ($action === 'created') {
            $newValues = $this->getAttributes();
            // Filter sensitive and internal fields
            $newValues = $this->filterAuditableAttributes($newValues);
        } elseif ($action === 'updated') {
            $newValues = $this->getDirty();
            $oldValues = array_intersect_key($this->getOriginal(), $newValues);
            
            // Filter sensitive and internal fields
            $newValues = $this->filterAuditableAttributes($newValues);
            $oldValues = $this->filterAuditableAttributes($oldValues);
            
            if (empty($newValues)) {
                return;
            }
        } elseif ($action === 'deleted') {
            $oldValues = $this->filterAuditableAttributes($this->getAttributes());
        }

        ActivityLog::create([
            'user_id'    => Auth::id(),
            'action'     => $action,
            'model_type' => get_class($this),
            'model_id'   => $this->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'url'        => Request::fullUrl(),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    protected function filterAuditableAttributes(array $attributes): array
    {
        $excluded = [
            'password',
            'remember_token',
            'created_at',
            'updated_at',
            'deleted_at',
            'two_factor_recovery_codes',
            'two_factor_secret',
            'two_factor_confirmed_at',
        ];

        return array_diff_key($attributes, array_flip($excluded));
    }
}
