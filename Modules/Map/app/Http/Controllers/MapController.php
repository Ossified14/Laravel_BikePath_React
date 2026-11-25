<?php

namespace Modules\Map\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Report\Models\Report;

class MapController extends Controller
{
    /**
     * Menampilkan peta navigasi Bikepath versi React Inertia.
     */
    public function index(): Response
    {
        $verifiedReports = [];

        if (Schema::hasTable('reports')) {
            $verifiedReports = Report::where('verification_status', 'verified')
                ->with('user:id,name')
                ->latest()
                ->get()
                ->map(fn (Report $report) => [
                    'id' => $report->id,
                    'hazard_type' => $report->hazard_type,
                    'description' => $report->description,
                    'photo_url' => $report->photo_url,
                    'created_at' => $report->created_at?->diffForHumans(),
                    'reporter_name' => $report->user?->name ?? 'Anonim',
                ]);
        }

        return Inertia::render('Map::index', [
            'verifiedReports' => $verifiedReports,
        ]);
    }
}
