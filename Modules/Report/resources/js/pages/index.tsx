import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText,
    Filter,
    Image as ImageIcon,
    MapPin,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    X,
    XCircle,
    Eye,
    Check,
} from 'lucide-react';
import { useSharedProps } from '@/hooks/use-shared-props';
import AppLayout from '@/layouts/app-layout';

interface ReportItem {
    id: number;
    user_id: number;
    hazard_type: string;
    description: string;
    hazard_photo: string;
    photo_url: string | null;
    verification_status: 'pending' | 'verified' | 'rejected';
    admin_notes: string | null;
    created_at: string;
    created_at_raw: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        phone_number?: string | null;
    } | null;
}

interface ReportPageProps {
    reports: ReportItem[];
    filters: {
        status?: string;
        search?: string;
        hazard_type?: string;
    };
    isAdmin: boolean;
}

const COMMON_HAZARDS = [
    'Jalan Rusak / Berlubang',
    'Pohon Tumbang / Ranting Besar',
    'Genangan Air Tinggi',
    'Sisa Material Proyek',
    'Jalan Licin / Tumpahan Oli',
    'Tutup Selokan Hilang',
    'Parkir Liar di Jalur Sepeda',
    'Lainnya',
];

export default function ReportIndex({ reports, filters, isAdmin }: ReportPageProps) {
    const { user, flash } = useSharedProps();

    // Filters state
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Modals state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editReport, setEditReport] = useState<ReportItem | null>(null);
    const [detailReport, setDetailReport] = useState<ReportItem | null>(null);
    const [verifyReport, setVerifyReport] = useState<ReportItem | null>(null);
    const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

    // Form for Create Report
    const createForm = useForm<{
        hazard_type: string;
        description: string;
        hazard_photo: File | null;
    }>({
        hazard_type: COMMON_HAZARDS[0],
        description: '',
        hazard_photo: null,
    });
    const [createPreview, setCreatePreview] = useState<string | null>(null);

    // Form for Edit Report
    const editForm = useForm<{
        hazard_type: string;
        description: string;
        hazard_photo: File | null;
    }>({
        hazard_type: '',
        description: '',
        hazard_photo: null,
    });
    const [editPreview, setEditPreview] = useState<string | null>(null);

    // Form for Admin Verify
    const verifyForm = useForm<{
        verification_status: 'pending' | 'verified' | 'rejected';
        admin_notes: string;
    }>({
        verification_status: 'verified',
        admin_notes: '',
    });

    // Handle Search & Filter submit
    const handleFilterApply = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/reports',
            {
                search: search || undefined,
                status: statusFilter || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleFilterReset = () => {
        setSearch('');
        setStatusFilter('');
        router.get('/reports', {}, { preserveState: true, preserveScroll: true });
    };

    // Open Edit modal
    const openEdit = (report: ReportItem) => {
        setEditReport(report);
        editForm.setData({
            hazard_type: report.hazard_type,
            description: report.description,
            hazard_photo: null,
        });
        setEditPreview(report.photo_url);
    };

    // Open Admin Verify modal
    const openVerify = (report: ReportItem) => {
        setVerifyReport(report);
        verifyForm.setData({
            verification_status: report.verification_status,
            admin_notes: report.admin_notes || '',
        });
    };

    // Submit Create
    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/reports', {
            forceFormData: true,
            onSuccess: () => {
                setShowCreateModal(false);
                createForm.reset();
                setCreatePreview(null);
            },
        });
    };

    // Submit Edit
    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editReport) return;

        editForm.post(`/reports/${editReport.id}`, {
            forceFormData: true,
            onSuccess: () => {
                setEditReport(null);
                editForm.reset();
                setEditPreview(null);
            },
        });
    };

    // Submit Admin Verify
    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifyReport) return;

        verifyForm.patch(`/reports/${verifyReport.id}/verify`, {
            onSuccess: () => {
                setVerifyReport(null);
                verifyForm.reset();
            },
        });
    };

    // Delete Report
    const handleDelete = (report: ReportItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus laporan #${report.id} (${report.hazard_type})?`)) {
            router.delete(`/reports/${report.id}`);
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Laporan Bahaya', href: '/reports' },
            ]}
        >
            <Head title="Pelaporan Halangan Jalur Sepeda - BikePath" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="font-extrabold text-2xl text-gray-900 tracking-tight">
                            Pelaporan Halangan Jalur Sepeda
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {isAdmin
                                ? 'Panel Admin: Verifikasi dan pantau laporan bahaya jalan raya dari pesepeda.'
                                : 'Panel Rider: Laporkan jalan berlubang, pohon tumbang, atau bahaya lainnya.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/map"
                            className="inline-flex items-center px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
                        >
                            <MapPin className="w-4 h-4 mr-1.5 text-emerald-600" />
                            Buka Peta
                        </Link>
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Buat Laporan Bahaya
                        </button>
                    </div>
                </div>

                {/* Role Information Banner */}
                <div
                    className={`p-5 rounded-2xl shadow-sm text-white ${
                        isAdmin
                            ? 'bg-gradient-to-r from-purple-900 to-indigo-800'
                            : 'bg-gradient-to-r from-emerald-800 to-teal-700'
                    }`}
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-2xl font-bold">
                                {isAdmin ? <Shield className="w-6 h-6 text-purple-200" /> : '🚴'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/20">
                                        Role: {user?.role || (isAdmin ? 'Admin' : 'Rider')}
                                    </span>
                                    <span className="text-xs opacity-75">Login sebagai: {user?.name}</span>
                                </div>
                                <h3 className="text-lg font-bold mt-0.5">
                                    {isAdmin ? 'Mode Manajemen & Verifikasi Admin' : 'Mode Pelaporan Rider'}
                                </h3>
                                <p className="text-xs opacity-90 mt-0.5 max-w-2xl">
                                    {isAdmin
                                        ? 'Anda berhak melihat semua laporan pengguna dan melakukan verifikasi status (Verified/Rejected) dengan catatan tindak lanjut.'
                                        : 'Unggah foto bukti halangan jalan. Laporan yang berstatus "Pending" dapat diedit atau dibatalkan oleh Anda.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleFilterApply} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Pencarian Laporan
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari jenis bahaya, deskripsi, atau nama pelapor..."
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pl-9 py-2 text-gray-800"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Search className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                                Status Verifikasi
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 py-2 text-gray-800"
                            >
                                <option value="">-- Semua Status --</option>
                                <option value="pending">Pending (Menunggu)</option>
                                <option value="verified">Verified (Diverifikasi)</option>
                                <option value="rejected">Rejected (Ditolak)</option>
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
                            {(search || statusFilter) && (
                                <button
                                    type="button"
                                    onClick={handleFilterReset}
                                    className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Reports Grid */}
                {reports.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
                                <AlertTriangle className="w-7 h-7 text-gray-300" />
                            </div>
                            <h3 className="text-base font-bold text-gray-800">Tidak ada laporan halangan</h3>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm">
                                Belum ada laporan bahaya yang sesuai dengan filter. Laporkan jika Anda menemukan bahaya di jalur sepeda!
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                            >
                                + Buat Laporan Sekarang
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {reports.map((report) => {
                            const isOwner = user?.id === report.user_id;
                            const canModify = (isOwner && report.verification_status === 'pending') || isAdmin;

                            return (
                                <div
                                    key={report.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200"
                                >
                                    <div>
                                        {/* Photo thumbnail */}
                                        <div
                                            className="relative h-44 w-full bg-gray-100 cursor-pointer overflow-hidden group"
                                            onClick={() => report.photo_url && setLightboxPhoto(report.photo_url)}
                                        >
                                            {report.photo_url ? (
                                                <img
                                                    src={report.photo_url}
                                                    alt={report.hazard_type}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ImageIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                            {/* Status Badge Over Image */}
                                            <div className="absolute top-3 left-3">
                                                {report.verification_status === 'verified' && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                                    </span>
                                                )}
                                                {report.verification_status === 'rejected' && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                                        <XCircle className="w-3.5 h-3.5" /> Ditolak
                                                    </span>
                                                )}
                                                {report.verification_status === 'pending' && (
                                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/90 text-white backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                                        <Clock className="w-3.5 h-3.5" /> Menunggu
                                                    </span>
                                                )}
                                            </div>
                                            <div className="absolute top-3 right-3 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                                                #{report.id}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                                                    {report.hazard_type}
                                                </h3>
                                            </div>

                                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                {report.description}
                                            </p>

                                            {/* Admin Notes Callout if verified/rejected */}
                                            {report.admin_notes && (
                                                <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 text-[11px] text-purple-900">
                                                    <span className="font-bold block text-[10px] uppercase text-purple-700">
                                                        Catatan Petugas:
                                                    </span>
                                                    {report.admin_notes}
                                                </div>
                                            )}

                                            {/* Reporter & Time meta */}
                                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                                                <span>Oleh: <strong className="text-gray-700">{report.user?.name || 'Anonim'}</strong></span>
                                                <span>{report.created_at}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Actions */}
                                    <div className="px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setDetailReport(report)}
                                            className="text-xs font-semibold text-gray-700 hover:text-gray-900 flex items-center gap-1"
                                        >
                                            <Eye className="w-3.5 h-3.5" /> Rincian
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => openVerify(report)}
                                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1"
                                                    title="Verifikasi status laporan ini"
                                                >
                                                    <Shield className="w-3 h-3" /> Verifikasi
                                                </button>
                                            )}

                                            {isOwner && report.verification_status === 'pending' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(report)}
                                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition"
                                                        title="Edit Laporan"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(report)}
                                                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                                                        title="Hapus Laporan"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL 1: CREATE REPORT */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-emerald-200" />
                                <h3 className="font-bold text-base">Buat Laporan Bahaya Baru</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreatePreview(null);
                                    createForm.reset();
                                }}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Jenis Bahaya / Kerusakan *
                                </label>
                                <select
                                    value={createForm.data.hazard_type}
                                    onChange={(e) => createForm.setData('hazard_type', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 py-2.5"
                                    required
                                >
                                    {COMMON_HAZARDS.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                                {createForm.errors.hazard_type && (
                                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.hazard_type}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Deskripsi Lokasi & Halangan *
                                </label>
                                <textarea
                                    rows={3}
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    placeholder="Jelaskan secara spesifik lokasi (nama jalan/patokan) serta kondisi bahaya..."
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 p-2.5"
                                    required
                                />
                                {createForm.errors.description && (
                                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.description}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Foto Bukti Halangan (Max 5MB) *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        createForm.setData('hazard_photo', file);
                                        if (file) {
                                            setCreatePreview(URL.createObjectURL(file));
                                        }
                                    }}
                                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                    required
                                />
                                {createPreview && (
                                    <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 h-36 w-full">
                                        <img src={createPreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {createForm.errors.hazard_photo && (
                                    <p className="text-[11px] text-rose-600 mt-1">{createForm.errors.hazard_photo}</p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreatePreview(null);
                                        createForm.reset();
                                    }}
                                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                                >
                                    {createForm.processing ? 'Mengirim...' : 'Kirim Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT REPORT */}
            {editReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 to-orange-700 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Pencil className="w-5 h-5 text-amber-200" />
                                <h3 className="font-bold text-base">Edit Laporan #{editReport.id}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditReport(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Jenis Bahaya *</label>
                                <select
                                    value={editForm.data.hazard_type}
                                    onChange={(e) => editForm.setData('hazard_type', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 py-2.5"
                                    required
                                >
                                    {COMMON_HAZARDS.map((h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi *</label>
                                <textarea
                                    rows={3}
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 p-2.5"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Ganti Foto (Opsional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        editForm.setData('hazard_photo', file);
                                        if (file) {
                                            setEditPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                                />
                                {editPreview && (
                                    <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 h-36 w-full">
                                        <img src={editPreview} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditReport(null)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                                >
                                    {editForm.processing ? 'Menyimpan...' : 'Perbarui Laporan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: DETAIL REPORT */}
            {detailReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
                        <div className="px-5 py-4 bg-gray-900 text-white flex items-center justify-between">
                            <h3 className="font-bold text-base">Detail Laporan Bahaya #{detailReport.id}</h3>
                            <button
                                type="button"
                                onClick={() => setDetailReport(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {detailReport.photo_url && (
                                <div
                                    className="relative h-52 w-full rounded-xl overflow-hidden cursor-pointer"
                                    onClick={() => setLightboxPhoto(detailReport.photo_url)}
                                >
                                    <img
                                        src={detailReport.photo_url}
                                        alt={detailReport.hazard_type}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition">
                                        <Eye className="w-6 h-6" />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Jenis Halangan</span>
                                    <span className="text-xs font-extrabold text-gray-900">
                                        {detailReport.hazard_type}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Pelapor</span>
                                    <span className="text-xs text-gray-800">
                                        {detailReport.user?.name} ({detailReport.user?.email})
                                    </span>
                                </div>
                                {detailReport.user?.phone_number && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Nomor HP</span>
                                        <span className="text-xs text-gray-800">{detailReport.user.phone_number}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Waktu Lapor</span>
                                    <span className="text-xs text-gray-800">{detailReport.created_at_raw}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            detailReport.verification_status === 'verified'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : detailReport.verification_status === 'rejected'
                                                ? 'bg-rose-100 text-rose-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}
                                    >
                                        {detailReport.verification_status}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100">
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Deskripsi Kejadian
                                </span>
                                <p className="text-xs text-gray-800 bg-gray-50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                                    {detailReport.description}
                                </p>
                            </div>

                            {detailReport.admin_notes && (
                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                                    <span className="block text-xs font-bold text-purple-900 uppercase mb-1">
                                        Catatan Verifikasi Admin
                                    </span>
                                    <p className="text-xs text-purple-800">{detailReport.admin_notes}</p>
                                </div>
                            )}

                            <div className="pt-3 border-t border-gray-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setDetailReport(null)}
                                    className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: ADMIN VERIFICATION */}
            {verifyReport && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
                        <div className="px-5 py-4 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-300" />
                                <h3 className="font-bold text-base">Verifikasi Laporan #{verifyReport.id}</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setVerifyReport(null)}
                                className="text-white/80 hover:text-white p-1 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleVerifySubmit} className="p-5 space-y-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-800 block">{verifyReport.hazard_type}</span>
                                <p className="text-[11px] text-gray-500 truncate mt-0.5">{verifyReport.description}</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Status Verifikasi *</label>
                                <select
                                    value={verifyForm.data.verification_status}
                                    onChange={(e) =>
                                        verifyForm.setData(
                                            'verification_status',
                                            e.target.value as 'pending' | 'verified' | 'rejected',
                                        )
                                    }
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 py-2.5"
                                    required
                                >
                                    <option value="verified">Verified (Disetujui - Tampilkan di Peta)</option>
                                    <option value="rejected">Rejected (Ditolak / Selesai / Tidak Valid)</option>
                                    <option value="pending">Pending (Menunggu Peninjauan)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Catatan / Tindak Lanjut Admin
                                </label>
                                <textarea
                                    rows={3}
                                    value={verifyForm.data.admin_notes}
                                    onChange={(e) => verifyForm.setData('admin_notes', e.target.value)}
                                    placeholder="Contoh: Tim lapangan Dishub telah dikirim untuk penanganan..."
                                    className="w-full text-xs rounded-xl border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 p-2.5"
                                />
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setVerifyReport(null)}
                                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={verifyForm.processing}
                                    className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                                >
                                    {verifyForm.processing ? 'Menyimpan...' : 'Simpan Verifikasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: FULL-SIZE PHOTO LIGHTBOX */}
            {lightboxPhoto && (
                <div
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
                    onClick={() => setLightboxPhoto(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxPhoto(null)}
                        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={lightboxPhoto}
                        alt="Full size view"
                        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </AppLayout>
    );
}
