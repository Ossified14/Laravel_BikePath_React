<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Modules\Map\Http\Controllers\MapController;
use Modules\Report\Models\Report;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Sebelum login: Halaman Peta (/ dan /map) dan fitur Autentikasi (/login, /register).
|
*/

Route::get('/', [MapController::class, 'index'])->name('home');

Route::get('/dashboard', function () {
    $totalUsers = User::count();
    $totalReports = Schema::hasTable('reports') ? Report::count() : 0;
    $verifiedReports = Schema::hasTable('reports') ? Report::where('verification_status', 'verified')->count() : 0;
    $pendingReports = Schema::hasTable('reports') ? Report::where('verification_status', 'pending')->count() : 0;
    $myReportsCount = Schema::hasTable('reports') ? Report::where('user_id', auth()->id())->count() : 0;

    return Inertia::render('dashboard', [
        'totalUsers' => $totalUsers,
        'totalReports' => $totalReports,
        'verifiedReports' => $verifiedReports,
        'pendingReports' => $pendingReports,
        'myReportsCount' => $myReportsCount,
    ]);
})->middleware(['auth'])->name('dashboard');

require __DIR__.'/settings.php';
