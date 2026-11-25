import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    Filter,
    Pencil,
    Plus,
    Search,
    Shield,
    Trash2,
    Users,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useSharedProps } from '@/hooks/use-shared-props';
import AppLayout from '@/layouts/app-layout';

interface UserItem {
    id: number;
    name: string;
    email: string;
    role: 'Admin' | 'Rider' | string;
    phone_number: string | null;
    address: string | null;
    reports_count: number;
    created_at: string;
}

interface PaginatedUsers {
    data: UserItem[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface UserManagementProps {
    users: PaginatedUsers;
    filters: {
        search?: string;
        role?: string;
    };
}

export default function UserIndex({ users, filters }: UserManagementProps) {
    const { user: currentUser, flash } = useSharedProps();
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/admin/users',
            {
                search: search || undefined,
                role: role || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setRole('');
        router.get('/admin/users', {}, { preserveState: true, preserveScroll: true });
    };

    const handleDelete = (targetUser: UserItem) => {
        if (currentUser?.id === targetUser.id) {
            alert('Anda tidak dapat menghapus akun Anda sendiri.');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${targetUser.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
            router.delete(`/admin/users/${targetUser.id}`);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kelola Pengguna', href: '/admin/users' },
            ]}
        >
            <Head title="Manajemen Pengguna - BikePath" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            Manajemen Pengguna (User Management)
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Kelola data seluruh akun pengguna dan hak akses sistem BikePath
                        </p>
                    </div>
                    <div>
                        <Link
                            href="/admin/users/create"
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-xs transition"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Tambah Pengguna
                        </Link>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Cari Nama / Email / No. HP
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Ketik kata kunci pencarian..."
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pl-9 py-2 text-gray-800"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Search className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Filter Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 py-2 text-gray-800"
                            >
                                <option value="">-- Semua Role --</option>
                                <option value="Admin">Admin</option>
                                <option value="Rider">Rider</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 py-2 px-3 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                            >
                                <Filter className="w-3.5 h-3.5" />
                                Terapkan
                            </button>
                            {(search || role) && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                            <thead className="bg-gray-50/80 text-gray-500 uppercase font-bold text-[11px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5">ID</th>
                                    <th className="px-5 py-3.5">Nama & Email</th>
                                    <th className="px-5 py-3.5">Peran (Role)</th>
                                    <th className="px-5 py-3.5">No. Telepon</th>
                                    <th className="px-5 py-3.5">Alamat Domisili</th>
                                    <th className="px-5 py-3.5 text-center">Laporan</th>
                                    <th className="px-5 py-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users className="w-10 h-10 text-gray-300 mb-2" />
                                                <p className="text-sm font-semibold text-gray-600">
                                                    Tidak ada data pengguna yang cocok
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Coba sesuaikan kata kunci pencarian atau filter role.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50/80 transition">
                                            <td className="px-5 py-3.5 font-mono text-gray-400 font-semibold">
                                                #{u.id}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-bold text-gray-900">{u.name}</div>
                                                <div className="text-[11px] text-gray-500">{u.email}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {u.role === 'Admin' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                                        🚴 Rider
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600 font-mono">
                                                {u.phone_number || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate" title={u.address || ''}>
                                                {u.address || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">
                                                    {u.reports_count}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="inline-flex items-center gap-1">
                                                    <Link
                                                        href={`/admin/users/${u.id}`}
                                                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                                                        title="Lihat Detail Pengguna"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/admin/users/${u.id}/edit`}
                                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                                                        title="Edit Pengguna"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    {currentUser?.id !== u.id && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(u)}
                                                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                                                            title="Hapus Pengguna"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {users.total > users.data.length && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
                            <div>
                                Menampilkan {users.from || 0} - {users.to || 0} dari total {users.total} pengguna
                            </div>
                            <div className="flex items-center gap-1">
                                {users.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                className="px-2.5 py-1 rounded-lg text-gray-300"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            className={`px-2.5 py-1 rounded-lg transition font-medium ${
                                                link.active
                                                    ? 'bg-emerald-600 text-white font-bold'
                                                    : 'hover:bg-gray-200 text-gray-700'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
