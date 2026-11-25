import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface EditUserProps {
    userData: {
        id: number;
        name: string;
        email: string;
        role: string;
        phone_number: string | null;
        address: string | null;
    };
}

export default function UserEdit({ userData }: EditUserProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        role: userData.role || 'Rider',
        phone_number: userData.phone_number || '',
        address: userData.address || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/users/${userData.id}`);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kelola Pengguna', href: '/admin/users' },
                { title: `Edit: ${userData.name}`, href: `/admin/users/${userData.id}/edit` },
            ]}
        >
            <Head title={`Edit Pengguna: ${userData.name} - BikePath`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            Edit Pengguna: {userData.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Perbarui data profil dan hak akses pengguna</p>
                    </div>
                    <div>
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Kembali ke Daftar
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5 text-gray-800"
                                    required
                                />
                                {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Alamat Email *
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5 text-gray-800"
                                    required
                                />
                                {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Password Baru (Kosongkan jika tidak diubah)
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Biarkan kosong untuk mempertahankan password lama"
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5 text-gray-800"
                                />
                                {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Hak Akses (Role) *
                                </label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5 text-gray-800"
                                    required
                                >
                                    <option value="Rider">Rider (Pesepeda)</option>
                                    <option value="Admin">Admin (Pengelola Dishub)</option>
                                </select>
                                {errors.role && <p className="text-[11px] text-rose-600 mt-1">{errors.role}</p>}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Nomor Telepon / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    value={data.phone_number}
                                    onChange={(e) => setData('phone_number', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5 text-gray-800"
                                />
                                {errors.phone_number && (
                                    <p className="text-[11px] text-rose-600 mt-1">{errors.phone_number}</p>
                                )}
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    Alamat Domisili
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5 text-gray-800"
                                />
                                {errors.address && <p className="text-[11px] text-rose-600 mt-1">{errors.address}</p>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                            <Link
                                href="/admin/users"
                                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {processing ? 'Menyimpan...' : 'Perbarui Pengguna'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
