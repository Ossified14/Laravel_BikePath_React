import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Compass,
    MapPin,
    Shield,
    User as UserIcon,
    Users,
    ArrowRight,
} from 'lucide-react';
import { useSharedProps } from '@/hooks/use-shared-props';
import AppLayout from '@/layouts/app-layout';

interface DashboardProps {
    totalUsers: number;
    totalReports: number;
    verifiedReports: number;
    pendingReports: number;
    myReportsCount: number;
}

export default function Dashboard({
    totalUsers,
    totalReports,
    verifiedReports,
    pendingReports,
    myReportsCount,
}: DashboardProps) {
    const { user, isAdmin } = useSharedProps();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
            ]}
        >
            <Head title="Dashboard - BikePath" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            Dashboard BikePath
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Selamat datang kembali, <span className="font-bold text-gray-900">{user?.name}</span>!
                        </p>
                    </div>
                    <div>
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isAdmin
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                            {isAdmin ? <Shield className="w-3.5 h-3.5 mr-1" /> : '🚴 '}
                            Role: {user?.role || (isAdmin ? 'Admin' : 'Rider')}
                        </span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* Stat 1 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {isAdmin ? 'Total Pengguna' : 'Laporan Saya'}
                            </span>
                            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">
                                {isAdmin ? totalUsers : myReportsCount}
                            </h3>
                            <span className="text-[11px] text-gray-500 mt-0.5 block">
                                {isAdmin ? 'Akun Admin & Rider' : 'Total laporan Anda kirim'}
                            </span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Laporan</span>
                            <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{totalReports}</h3>
                            <span className="text-[11px] text-gray-500 mt-0.5 block">Seluruh bahaya jalan</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Telah Terverifikasi</span>
                            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{verifiedReports}</h3>
                            <span className="text-[11px] text-gray-500 mt-0.5 block">Ditampilkan di peta</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl font-bold">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Stat 4 */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menunggu Verifikasi</span>
                            <h3 className="text-3xl font-extrabold text-amber-500 mt-1">{pendingReports}</h3>
                            <span className="text-[11px] text-gray-500 mt-0.5 block">Status pending</span>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Main Feature Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Peta & Navigasi */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-4">
                                <Compass className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-extrabold mb-1.5">Peta & Navigasi Rute</h3>
                            <p className="text-xs opacity-90 leading-relaxed mb-6">
                                Akses peta jalur sepeda interaktif (Leaflet & OpenStreetMap) dengan perhitungan rute otomatis dari OSRM dan pemantauan marker halangan jalan.
                            </p>
                        </div>
                        <Link
                            href="/map"
                            className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-emerald-800 font-bold text-xs rounded-xl text-center shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                            Buka Peta Navigasi <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Card 2: Pelaporan Bahaya */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-extrabold mb-1.5">Pelaporan Bahaya</h3>
                            <p className="text-xs opacity-90 leading-relaxed mb-6">
                                Kirim laporan kerusakan jalan atau rintangan dengan unggah foto instan, serta pelacakan status verifikasi realtime oleh petugas.
                            </p>
                        </div>
                        <Link
                            href="/reports"
                            className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-blue-800 font-bold text-xs rounded-xl text-center shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                            {isAdmin ? 'Verifikasi Laporan' : 'Kelola Laporan Saya'} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Card 3: Manajemen Pengguna (Admin) or Profil (Rider) */}
                    {isAdmin ? (
                        <div className="bg-gradient-to-br from-purple-700 to-violet-800 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-4">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-extrabold mb-1.5">Manajemen Pengguna</h3>
                                <p className="text-xs opacity-90 leading-relaxed mb-6">
                                    Pengelolaan akun pengguna, pengaturan hak akses Admin dan Rider, serta pencarian pengguna secara komprehensif.
                                </p>
                            </div>
                            <Link
                                href="/admin/users"
                                className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-purple-800 font-bold text-xs rounded-xl text-center shadow-xs transition flex items-center justify-center gap-1.5"
                            >
                                Kelola Akun Pengguna <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl mb-4">
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-extrabold mb-1.5">Profil Pesepeda</h3>
                                <p className="text-xs opacity-90 leading-relaxed mb-6">
                                    Perbarui data pribadi Anda, nomor WhatsApp aktif, dan alamat tempat tinggal untuk kelancaran pelaporan.
                                </p>
                            </div>
                            <Link
                                href="/settings/profile"
                                className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs rounded-xl text-center shadow-xs transition flex items-center justify-center gap-1.5"
                            >
                                Edit Profil Saya <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
