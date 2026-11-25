<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\Report\Models\Report;

test('guests cannot visit reports page', function () {
    $response = $this->get(route('reports.index'));
    $response->assertRedirect(route('login'));
});

test('riders can visit reports page and see their own reports', function () {
    $rider = User::factory()->create(['role' => 'Rider']);
    $otherRider = User::factory()->create(['role' => 'Rider']);

    Report::create([
        'user_id' => $rider->id,
        'hazard_type' => 'Jalan Rusak',
        'description' => 'Lubang di jalur sepeda',
        'hazard_photo' => 'reports/sample.jpg',
        'verification_status' => 'pending',
    ]);

    Report::create([
        'user_id' => $otherRider->id,
        'hazard_type' => 'Pohon Tumbang',
        'description' => 'Dahan patah',
        'hazard_photo' => 'reports/sample.jpg',
        'verification_status' => 'pending',
    ]);

    $this->actingAs($rider);
    $response = $this->get(route('reports.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Report::index')
        ->has('reports', 1)
    );
});

test('riders can create a hazard report with photo', function () {
    Storage::fake('public');
    $rider = User::factory()->create(['role' => 'Rider']);
    $this->actingAs($rider);

    $file = UploadedFile::fake()->image('hazard.jpg', 640, 480);

    $response = $this->post(route('reports.store'), [
        'hazard_type' => 'Jalan Rusak / Berlubang',
        'description' => 'Lubang besar di tikungan jalur sepeda',
        'hazard_photo' => $file,
    ]);

    $response->assertSessionHas('success');
    $this->assertDatabaseHas('reports', [
        'user_id' => $rider->id,
        'hazard_type' => 'Jalan Rusak / Berlubang',
        'verification_status' => 'pending',
    ]);
});

test('admins can verify report status', function () {
    $admin = User::factory()->create(['role' => 'Admin']);
    $rider = User::factory()->create(['role' => 'Rider']);

    $report = Report::create([
        'user_id' => $rider->id,
        'hazard_type' => 'Genangan Air',
        'description' => 'Banjir lokal',
        'hazard_photo' => 'reports/sample.jpg',
        'verification_status' => 'pending',
    ]);

    $this->actingAs($admin);
    $response = $this->patch(route('reports.verify', $report->id), [
        'verification_status' => 'verified',
        'admin_notes' => 'Petugas PPSU dikonfirmasi.',
    ]);

    $response->assertSessionHas('success');
    expect($report->fresh()->verification_status)->toBe('verified');
    expect($report->fresh()->admin_notes)->toBe('Petugas PPSU dikonfirmasi.');
});
