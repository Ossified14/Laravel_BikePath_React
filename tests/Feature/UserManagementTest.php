<?php

use App\Models\User;

test('riders cannot visit user management page', function () {
    $rider = User::factory()->create(['role' => 'Rider']);
    $this->actingAs($rider);

    $response = $this->get(route('admin.users.index'));
    $response->assertForbidden();
});

test('admins can visit user management page', function () {
    $admin = User::factory()->create(['role' => 'Admin']);
    $this->actingAs($admin);

    $response = $this->get(route('admin.users.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('UserManagement::index')
        ->has('users.data')
    );
});

test('admins can create a new user', function () {
    $admin = User::factory()->create(['role' => 'Admin']);
    $this->actingAs($admin);

    $response = $this->post(route('admin.users.store'), [
        'name' => 'Pesepeda Baru',
        'email' => 'pesepeda.baru@example.com',
        'password' => 'password123',
        'role' => 'Rider',
        'phone_number' => '081299998888',
        'address' => 'Jl. Kebon Jeruk',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    $this->assertDatabaseHas('users', [
        'email' => 'pesepeda.baru@example.com',
        'role' => 'Rider',
    ]);
});

test('admins can update user data', function () {
    $admin = User::factory()->create(['role' => 'Admin']);
    $rider = User::factory()->create(['role' => 'Rider', 'name' => 'Lama']);
    $this->actingAs($admin);

    $response = $this->put(route('admin.users.update', $rider->id), [
        'name' => 'Nama Baru',
        'email' => $rider->email,
        'role' => 'Rider',
        'phone_number' => '089999999999',
        'address' => 'Jl. Baru',
    ]);

    $response->assertRedirect(route('admin.users.index'));
    expect($rider->fresh()->name)->toBe('Nama Baru');
});

test('admins cannot delete their own account', function () {
    $admin = User::factory()->create(['role' => 'Admin']);
    $this->actingAs($admin);

    $response = $this->delete(route('admin.users.destroy', $admin->id));
    $response->assertRedirect(route('admin.users.index'));
    $response->assertSessionHas('error');
    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});
