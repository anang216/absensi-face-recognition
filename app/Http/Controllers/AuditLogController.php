<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $logs = Activity::with('causer')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('auditlogs/Index', [
            'logs' => $logs,
        ]);
    }
}
