<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    /**
     * Display a listing of the activity logs.
     */
    public function index(Request $request)
    {
        $logs = ActivityLog::with('user')
            ->when($request->search, function ($query, $search) {
                $query->where('model_type', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%");
            })
            ->when($request->user_id, function ($query, $user_id) {
                $query->where('user_id', $user_id);
            })
            ->when($request->date_from, function ($query, $date_from) {
                $query->whereDate('created_at', '>=', $date_from);
            })
            ->when($request->date_to, function ($query, $date_to) {
                $query->whereDate('created_at', '<=', $date_to);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ActivityLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['search', 'user_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display the specified activity log.
     */
    public function show(ActivityLog $activityLog)
    {
        return Inertia::render('ActivityLogs/Show', [
            'log' => $activityLog->load('user'),
        ]);
    }
}
