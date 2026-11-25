import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Shield,
    XCircle,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface ReportDetail {
    id: number;
    hazard_type: string;
    description: string;
    photo_url: string | null;
    verification_status: 'pending' | 'verified' | 'rejected';
    created_at: string;
}

interface UserShowProps {
    userData: {
        id: number;
        name: string;
        email: string;
        role: string;
        phone_number: string | null;
        address: string | null;
        created_at: string;
        reports: ReportDetail[];
    };
}

export default function UserShow({ userData }: UserShowProps) {
    const initials = userData.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kelola Pengguna', href: '/admin/users' },
                { title: userData.name, href: `/admin/users/${userData.id}` },
            ]}
        >
            <Head title={`Detail Pengguna: ${userData.name} - BikePath`} />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            Detail Pengguna: {userData.name}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Informasi lengkap akun dan riwayat aktivitas pelaporan
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/users/${userData.id}/edit`}
                            className="inline-flex items-center px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-xs transition"
                        >
                            <Pencil className="w-4 h-4 mr-1.5" />
                            Edit
                        </Link>
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs transition"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1.5" />
                            Kembali
                        </Link>
                    </div>
                </div>

                {/* Profile Summary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-gray-100">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-2xl shadow-sm">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-2xl font-extrabold text-gray-900">{userData.name}</h2>
                                {userData.role === 'Admin' ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                                        <Shield className="w-3.5 h-3.5" /> Admin
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                        🚴 Rider (Pesepeda)
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {userData.email}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Terdaftar pada: {userData.created_at}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-600" /> Nomor Telepon / WA
                            </span>
                            <p className="text-sm font-semibold text-gray-800 mt-1 font-mono">
                                {userData.phone_number || '-'}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 md:col-span-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-600" /> Alamat Domisili
                            </span>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {userData.address || '-'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* User's Hazard Reports */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Riwayat Laporan Bahaya ({userData.reports.length})
                        </h3>
                    </div>

                    {userData.reports.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs">
                            Pengguna ini belum pernah mengirimkan laporan bahaya.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
                                <thead className="bg-gray-50/80 text-gray-500 uppercase font-bold text-[10px]">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Jenis Bahaya</th>
                                        <th className="px-4 py-3">Deskripsi</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Waktu Lapor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {userData.reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50/80 transition">
                                            <td className="px-4 py-3 font-mono text-gray-400">#{report.id}</td>
                                            <td className="px-4 py-3 font-bold text-gray-900">{report.hazard_type}</td>
                                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                                {report.description}
                                            </td>
                                            <td className="px-4 py-3">
                                                {report.verification_status === 'verified' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                                                        <CheckCircle2 className="w-3 h-3" /> Verified
                                                    </span>
                                                )}
                                                {report.verification_status === 'rejected' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                                                        <XCircle className="w-3 h-3" /> Ditolak
                                                    </span>
                                                )}
                                                {report.verification_status === 'pending' && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                                                        <Clock className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{report.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
