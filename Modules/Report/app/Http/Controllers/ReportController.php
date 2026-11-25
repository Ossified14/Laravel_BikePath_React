<?php

namespace Modules\Report\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Report\Models\Report;

class ReportController extends Controller
{
    /**
     * Display the main interactive report page via Inertia React.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $query = Report::with('user:id,name,email,role,phone_number');

        // Role restriction: Rider only sees their own reports
        /** @var \App\Models\User $user */
        if ($user->isRider()) {
            $query->where('user_id', $user->id);
        }

        // Filter by verification status
        if ($request->filled('status')) {
            $query->where('verification_status', $request->input('status'));
        }

        // Filter by hazard type
        if ($request->filled('hazard_type')) {
            $query->where('hazard_type', $request->input('hazard_type'));
        }

        // Search in description, hazard_type, or reporter name
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('hazard_type', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $reports = $query->latest()->get()->map(function (Report $report) {
            return [
                'id' => $report->id,
                'user_id' => $report->user_id,
                'hazard_type' => $report->hazard_type,
                'description' => $report->description,
                'hazard_photo' => $report->hazard_photo,
                'photo_url' => $report->photo_url,
                'verification_status' => $report->verification_status,
                'admin_notes' => $report->admin_notes,
                'created_at' => $report->created_at?->diffForHumans(),
                'created_at_raw' => $report->created_at?->format('d M Y, H:i'),
                'user' => $report->user ? [
                    'id' => $report->user->id,
                    'name' => $report->user->name,
                    'email' => $report->user->email,
                    'role' => $report->user->role,
                    'phone_number' => $report->user->phone_number,
                ] : null,
            ];
        });

        return Inertia::render('Report::index', [
            'reports' => $reports,
            'filters' => [
                'status' => $request->input('status', ''),
                'search' => $request->input('search', ''),
                'hazard_type' => $request->input('hazard_type', ''),
            ],
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    /**
     * Fetch reports data via AJAX / JSON API (optional).
     */
    public function getData(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Report::with('user:id,name,email,role,phone_number');

        /** @var \App\Models\User $user */
        if ($user->isRider()) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('verification_status', $request->input('status'));
        }

        if ($request->filled('hazard_type')) {
            $query->where('hazard_type', $request->input('hazard_type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('hazard_type', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $reports = $query->latest()->get();

        return response()->json([
            'success' => true,
            'is_admin' => $user->isAdmin(),
            'current_user_id' => $user->id,
            'data' => $reports,
        ]);
    }

    /**
     * Store a newly created report (FormData with file upload).
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'hazard_type' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:2000'],
            'hazard_photo' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'], // Max 5MB
        ], [
            'hazard_photo.required' => 'Foto bukti halangan jalan wajib diunggah.',
            'hazard_photo.image' => 'File harus berupa gambar (JPEG, PNG, JPG, atau WebP).',
            'hazard_photo.max' => 'Ukuran foto maksimal adalah 5MB.',
        ]);

        if ($request->hasFile('hazard_photo')) {
            $photoPath = $request->file('hazard_photo')->store('reports', 'public');
            $validated['hazard_photo'] = $photoPath;
        }

        $validated['user_id'] = Auth::id();
        $validated['verification_status'] = 'pending';

        $report = Report::create($validated);
        $report->load('user:id,name,email');

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Laporan halangan berhasil dikirim dan sedang menunggu verifikasi admin.',
                'data' => $report,
            ], 201);
        }

        return redirect()->back()->with('success', 'Laporan halangan berhasil dikirim dan sedang menunggu verifikasi admin.');
    }

    /**
     * Show single report details.
     */
    public function show(string $id): JsonResponse
    {
        $user = Auth::user();
        $report = Report::with('user:id,name,email,phone_number')->findOrFail($id);

        /** @var \App\Models\User $user */
        if ($user->isRider() && $report->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda hanya dapat melihat rincian laporan milik sendiri.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Update report. Rider can only edit if status is 'pending'.
     */
    public function update(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $user = Auth::user();
        $report = Report::findOrFail($id);

        /** @var \App\Models\User $user */
        if ($user->isRider()) {
            if ($report->user_id !== $user->id) {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Akses ditolak. Laporan ini bukan milik Anda.'], 403);
                }
                return redirect()->back()->with('error', 'Akses ditolak. Laporan ini bukan milik Anda.');
            }

            if ($report->verification_status !== 'pending') {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Laporan yang telah diverifikasi atau ditolak tidak dapat diubah lagi.'], 403);
                }
                return redirect()->back()->with('error', 'Laporan yang telah diverifikasi atau ditolak tidak dapat diubah lagi.');
            }
        }

        $validated = $request->validate([
            'hazard_type' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:2000'],
            'hazard_photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
        ]);

        if ($request->hasFile('hazard_photo')) {
            if ($report->hazard_photo && ! str_contains($report->hazard_photo, 'sample-hazard.jpg')) {
                Storage::disk('public')->delete($report->hazard_photo);
            }
            $validated['hazard_photo'] = $request->file('hazard_photo')->store('reports', 'public');
        }

        $report->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Laporan berhasil diperbarui.',
                'data' => $report,
            ]);
        }

        return redirect()->back()->with('success', 'Laporan berhasil diperbarui.');
    }

    /**
     * Delete report. Rider can only delete if status is 'pending'.
     */
    public function destroy(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $user = Auth::user();
        $report = Report::findOrFail($id);

        /** @var \App\Models\User $user */
        if ($user->isRider()) {
            if ($report->user_id !== $user->id) {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Akses ditolak. Laporan ini bukan milik Anda.'], 403);
                }
                return redirect()->back()->with('error', 'Akses ditolak. Laporan ini bukan milik Anda.');
            }

            if ($report->verification_status !== 'pending') {
                if ($request->wantsJson()) {
                    return response()->json(['success' => false, 'message' => 'Laporan yang sudah diverifikasi tidak dapat dihapus.'], 403);
                }
                return redirect()->back()->with('error', 'Laporan yang sudah diverifikasi tidak dapat dihapus.');
            }
        }

        if ($report->hazard_photo && ! str_contains($report->hazard_photo, 'sample-hazard.jpg')) {
            Storage::disk('public')->delete($report->hazard_photo);
        }

        $report->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Laporan halangan berhasil dihapus.',
            ]);
        }

        return redirect()->back()->with('success', 'Laporan halangan berhasil dihapus.');
    }

    /**
     * Admin action to verify or reject report.
     */
    public function verifyStatus(Request $request, string $id): RedirectResponse|JsonResponse
    {
        $user = Auth::user();
        /** @var \App\Models\User $user */
        if (! $user->isAdmin()) {
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak. Hanya Admin yang berhak memverifikasi laporan.'], 403);
            }
            return redirect()->back()->with('error', 'Akses ditolak. Hanya Admin yang berhak memverifikasi laporan.');
        }

        $report = Report::findOrFail($id);

        $validated = $request->validate([
            'verification_status' => ['required', Rule::in(['pending', 'verified', 'rejected'])],
            'admin_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $report->update($validated);

        $statusText = match ($validated['verification_status']) {
            'verified' => 'Diverifikasi (Verified)',
            'rejected' => 'Ditolak (Rejected)',
            default => 'Pending',
        };

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Status laporan #{$report->id} berhasil diubah menjadi: {$statusText}.",
                'data' => $report,
            ]);
        }

        return redirect()->back()->with('success', "Status laporan #{$report->id} berhasil diubah menjadi: {$statusText}.");
    }
}
