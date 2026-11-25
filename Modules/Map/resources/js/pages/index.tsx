import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Bike,
    ChevronDown,
    ChevronUp,
    Crosshair,
    MapPin,
    RotateCw,
    Search,
    X,
    Navigation,
    Compass,
    AlertTriangle,
    Shield,
    Users,
    LayoutDashboard,
    LogIn,
    UserPlus,
    LogOut,
} from 'lucide-react';
import { useSharedProps } from '@/hooks/use-shared-props';

interface VerifiedReport {
    id: number;
    hazard_type: string;
    description: string;
    photo_url: string | null;
    created_at: string;
    reporter_name: string;
}

interface MapProps {
    verifiedReports?: VerifiedReport[];
}

export default function MapPage({ verifiedReports = [] }: MapProps) {
    const { user, isAdmin } = useSharedProps();
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    // Navigation and route state
    const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
    const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
    const [originText, setOriginText] = useState('');
    const [destText, setDestText] = useState('');
    const [activeMode, setActiveMode] = useState<'origin' | 'destination'>('origin');

    // Autocomplete dropdowns
    const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
    const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
    const [isSearchingDest, setIsSearchingDest] = useState(false);

    // Route calculation summary
    const [isRouting, setIsRouting] = useState(false);
    const [routeSummary, setRouteSummary] = useState<{
        distanceKm: string;
        bikeDuration: string;
        carDuration: string;
    } | null>(null);
    const [statusNotice, setStatusNotice] = useState<string>(
        'Klik pada peta untuk menaruh titik awal atau cari lokasi di panel navigasi.',
    );
    const [isPanelMinimized, setIsPanelMinimized] = useState(false);

    // Leaflet Layers references
    const markerOriginRef = useRef<L.Marker | null>(null);
    const markerDestRef = useRef<L.Marker | null>(null);
    const routeLayerRef = useRef<L.GeoJSON | null>(null);
    const routeCasingRef = useRef<L.GeoJSON | null>(null);

    const defaultCoords: [number, number] = [-6.2088, 106.8456]; // Jakarta
    const defaultZoom = 13;

    // Custom marker pin generator
    const createPinIcon = (type: 'origin' | 'destination', label: string) => {
        const bgClass =
            type === 'origin'
                ? 'background: linear-gradient(135deg, #10b981, #059669); border: 2px solid #ffffff;'
                : 'background: linear-gradient(135deg, #ef4444, #b91c1c); border: 2px solid #ffffff;';

        return L.divIcon({
            className: 'custom-pin-wrapper',
            html: `
                <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,0.35);cursor:grab;${bgClass}">
                    <span style="transform:rotate(45deg);color:#ffffff;font-weight:700;font-size:13px;user-select:none;">${label}</span>
                </div>
            `,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34],
        });
    };

    // Format duration helper
    const formatDuration = (minutes: number) => {
        if (minutes >= 60) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
        }
        return `${minutes} menit`;
    };

    // 1. Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
        }).setView(defaultCoords, defaultZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // 2. Handle map clicks based on activeMode
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            const newCoords: [number, number] = [lat, lng];

            if (activeMode === 'origin') {
                updateOrigin(newCoords, `Titik Terpilih (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                if (!destCoords) {
                    setActiveMode('destination');
                    setStatusNotice('Titik awal diset. Klik peta untuk menentukan titik tujuan.');
                }
            } else {
                updateDestination(newCoords, `Titik Terpilih (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                if (originCoords) {
                    setStatusNotice('Menghitung rute...');
                }
            }
        };

        map.on('click', handleMapClick);
        return () => {
            map.off('click', handleMapClick);
        };
    }, [activeMode, originCoords, destCoords]);

    // 3. Update Origin marker & coordinate
    const updateOrigin = (latLng: [number, number], displayName: string) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        setOriginCoords(latLng);
        setOriginText(displayName);

        if (markerOriginRef.current) {
            markerOriginRef.current.setLatLng(latLng);
        } else {
            const marker = L.marker(latLng, {
                icon: createPinIcon('origin', 'A'),
                draggable: true,
            }).addTo(map);

            marker.bindPopup('<strong>Titik Awal (Origin)</strong><br><small>Geser pin untuk memindahkan</small>');
            marker.on('dragend', (ev) => {
                const pos = ev.target.getLatLng();
                const updated: [number, number] = [pos.lat, pos.lng];
                setOriginCoords(updated);
                setOriginText(`Posisi Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
            });

            markerOriginRef.current = marker;
        }
    };

    // 4. Update Destination marker & coordinate
    const updateDestination = (latLng: [number, number], displayName: string) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        setDestCoords(latLng);
        setDestText(displayName);

        if (markerDestRef.current) {
            markerDestRef.current.setLatLng(latLng);
        } else {
            const marker = L.marker(latLng, {
                icon: createPinIcon('destination', 'B'),
                draggable: true,
            }).addTo(map);

            marker.bindPopup('<strong>Titik Tujuan (Destination)</strong><br><small>Geser pin untuk memindahkan</small>');
            marker.on('dragend', (ev) => {
                const pos = ev.target.getLatLng();
                const updated: [number, number] = [pos.lat, pos.lng];
                setDestCoords(updated);
                setDestText(`Posisi Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
            });

            markerDestRef.current = marker;
        }
    };

    // 5. Automatic Route Calculation when both coordinates change
    useEffect(() => {
        if (originCoords && destCoords) {
            calculateRoute();
        }
    }, [originCoords, destCoords]);

    const calculateRoute = () => {
        if (!originCoords || !destCoords) return;

        setIsRouting(true);
        setStatusNotice('Menghubungi OSRM engine untuk mencari rute terbaik...');

        const originLngLat = `${originCoords[1]},${originCoords[0]}`;
        const destLngLat = `${destCoords[1]},${destCoords[0]}`;
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLngLat};${destLngLat}?overview=full&geometries=geojson&steps=true`;

        fetch(osrmUrl)
            .then((res) => {
                if (!res.ok) throw new Error('Respon OSRM gagal');
                return res.json();
            })
            .then((data) => {
                setIsRouting(false);
                if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                    setStatusNotice('Tidak ada rute yang terhubung di jaringan jalan.');
                    return;
                }

                const route = data.routes[0];
                drawRoute(route.geometry);

                // Summary calculation
                const distM = route.distance;
                const durS = route.duration;
                const distKm = distM >= 1000 ? (distM / 1000).toFixed(2) + ' km' : Math.round(distM) + ' m';
                const bikeTotalHours = distM / 1000 / 18; // 18 km/h cycling speed
                const bikeMin = Math.max(1, Math.round(bikeTotalHours * 60));
                const carMin = Math.max(1, Math.round(durS / 60));

                setRouteSummary({
                    distanceKm: distKm,
                    bikeDuration: formatDuration(bikeMin),
                    carDuration: `~${formatDuration(carMin)}`,
                });

                setStatusNotice('Rute berhasil dibuat mengikuti jaringan jalan nyata!');
            })
            .catch((err) => {
                console.error('OSRM Routing Error:', err);
                setIsRouting(false);
                setStatusNotice('Gagal menghubungkan ke server rute OSRM.');
            });
    };

    const drawRoute = (geoJsonGeometry: any) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        clearRouteLayers();

        // Casing layer for contrast
        routeCasingRef.current = L.geoJSON(geoJsonGeometry, {
            style: {
                color: '#064e3b',
                weight: 8,
                opacity: 0.6,
                lineJoin: 'round',
                lineCap: 'round',
            },
        }).addTo(map);

        // Main emerald route line
        routeLayerRef.current = L.geoJSON(geoJsonGeometry, {
            style: {
                color: '#10b981',
                weight: 5,
                opacity: 0.95,
                lineJoin: 'round',
                lineCap: 'round',
            },
        }).addTo(map);

        map.fitBounds(routeLayerRef.current.getBounds(), {
            padding: [60, 60],
            maxZoom: 16,
        });
    };

    const clearRouteLayers = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current);
            routeLayerRef.current = null;
        }
        if (routeCasingRef.current) {
            map.removeLayer(routeCasingRef.current);
            routeCasingRef.current = null;
        }
        setRouteSummary(null);
    };

    const resetAll = () => {
        const map = mapInstanceRef.current;
        setOriginCoords(null);
        setDestCoords(null);
        setOriginText('');
        setDestText('');
        setOriginSuggestions([]);
        setDestSuggestions([]);
        clearRouteLayers();

        if (markerOriginRef.current && map) {
            map.removeLayer(markerOriginRef.current);
            markerOriginRef.current = null;
        }
        if (markerDestRef.current && map) {
            map.removeLayer(markerDestRef.current);
            markerDestRef.current = null;
        }

        if (map) {
            map.setView(defaultCoords, defaultZoom);
        }

        setActiveMode('origin');
        setStatusNotice('Peta di-reset. Klik pada peta untuk mulai menentukan titik awal.');
    };

    const handleSwapRoute = () => {
        if (!originCoords && !destCoords) return;

        const tempCoords = originCoords;
        const tempText = originText;

        if (destCoords) {
            updateOrigin(destCoords, destText);
        } else {
            setOriginCoords(null);
            setOriginText('');
            if (markerOriginRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(markerOriginRef.current);
                markerOriginRef.current = null;
            }
        }

        if (tempCoords) {
            updateDestination(tempCoords, tempText);
        } else {
            setDestCoords(null);
            setDestText('');
            if (markerDestRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeLayer(markerDestRef.current);
                markerDestRef.current = null;
            }
        }
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation) {
            alert('Browser Anda tidak mendukung Geolocation.');
            return;
        }

        setStatusNotice('Mendeteksi lokasi GPS Anda...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords: [number, number] = [position.coords.latitude, position.coords.longitude];
                updateOrigin(userCoords, 'Lokasi GPS Saya');
                mapInstanceRef.current?.setView(userCoords, 15);
                if (!destCoords) {
                    setActiveMode('destination');
                    setStatusNotice('Lokasi GPS diset sebagai Titik Awal. Klik tujuan di peta.');
                }
            },
            (err) => {
                alert('Gagal mengambil lokasi GPS: ' + err.message);
                setStatusNotice('Izin lokasi ditolak atau gagal mendeteksi GPS.');
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    };

    // Autocomplete searching with Photon Komoot API
    const handleSearchGeocode = (query: string, type: 'origin' | 'destination') => {
        if (type === 'origin') {
            setOriginText(query);
            if (query.trim().length < 2) {
                setOriginSuggestions([]);
                return;
            }
            setIsSearchingOrigin(true);
        } else {
            setDestText(query);
            if (query.trim().length < 2) {
                setDestSuggestions([]);
                return;
            }
            setIsSearchingDest(true);
        }

        const map = mapInstanceRef.current;
        const center = map ? map.getCenter() : { lat: defaultCoords[0], lng: defaultCoords[1] };
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${center.lat}&lon=${center.lng}&limit=5&lang=id`;

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                const features = data.features || [];
                if (type === 'origin') {
                    setOriginSuggestions(features);
                    setIsSearchingOrigin(false);
                } else {
                    setDestSuggestions(features);
                    setIsSearchingDest(false);
                }
            })
            .catch(() => {
                if (type === 'origin') setIsSearchingOrigin(false);
                else setIsSearchingDest(false);
            });
    };

    const handleSelectSuggestion = (feature: any, type: 'origin' | 'destination') => {
        const coords = feature.geometry.coordinates; // [lng, lat]
        const props = feature.properties;
        const title = props.name || props.street || 'Lokasi Terpilih';
        const details = [props.street, props.district, props.city, props.country].filter(Boolean).join(', ');
        const fullName = details ? `${title}, ${details}` : title;
        const latLng: [number, number] = [coords[1], coords[0]];

        if (type === 'origin') {
            updateOrigin(latLng, fullName);
            setOriginSuggestions([]);
            mapInstanceRef.current?.setView(latLng, 15);
            if (!destCoords) setActiveMode('destination');
        } else {
            updateDestination(latLng, fullName);
            setDestSuggestions([]);
            mapInstanceRef.current?.setView(latLng, 15);
        }
    };

    const handleFocusRoute = () => {
        if (routeLayerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 60] });
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans">
            <Head title="Peta & Navigasi Jalur Sepeda - BikePath" />

            {/* Top Navigation Bar */}
            <header className="z-[1100] h-16 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                            <Bike className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-gray-900">
                            Bike<span className="text-emerald-600">path</span>
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                        <Link
                            href="/map"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-1.5"
                        >
                            <Compass className="w-4 h-4 text-emerald-600" />
                            Peta
                        </Link>
                        {user && (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1.5 transition"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Dashboard
                                </Link>
                                <Link
                                    href="/reports"
                                    className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1.5 transition"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    {isAdmin ? 'Verifikasi Laporan' : 'Laporan Bahaya'}
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/admin/users"
                                        className="px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1.5 transition"
                                    >
                                        <Users className="w-4 h-4" />
                                        Kelola Pengguna
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex flex-col text-right">
                                <span className="text-xs font-bold text-gray-900 leading-tight">{user.name}</span>
                                <span className="text-[10px] text-gray-500">
                                    {isAdmin ? 'Admin Dishub' : 'Pesepeda (Rider)'}
                                </span>
                            </div>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                                }`}
                            >
                                {user.role || (isAdmin ? 'Admin' : 'Rider')}
                            </span>
                            <button
                                onClick={() => router.post('/logout')}
                                className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Keluar (Log Out)"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition flex items-center gap-1.5"
                            >
                                <LogIn className="w-3.5 h-3.5" />
                                Masuk
                            </Link>
                            <Link
                                href="/register"
                                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
                            >
                                <UserPlus className="w-3.5 h-3.5" />
                                Daftar
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Map Container with Floating Routing Panel */}
            <div className="relative flex-1 w-full h-[calc(100vh-64px)]">
                {/* Full-bleed Leaflet Map */}
                <div ref={mapContainerRef} className="w-full h-full z-0" />

                {/* Floating Routing & Geocoding Panel */}
                <div className="absolute top-4 left-4 z-[1000] w-[calc(100%-2rem)] sm:w-[410px]">
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300">
                        {/* Panel Header */}
                        <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg">
                                    🚴
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm tracking-tight">Rute & Navigasi Sepeda</h3>
                                    <p className="text-[11px] text-emerald-100">OSRM Engine + Autocomplete</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsPanelMinimized(!isPanelMinimized)}
                                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
                                title="Minimize / Expand Panel"
                            >
                                {isPanelMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Collapsible Content */}
                        {!isPanelMinimized && (
                            <div className="p-4 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto">
                                {/* Mode Selection Buttons */}
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200/80">
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('origin')}
                                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                            activeMode === 'origin'
                                                ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                                        Klik Titik Awal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('destination')}
                                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                                            activeMode === 'destination'
                                                ? 'bg-white text-rose-700 shadow-xs border border-rose-200'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                                        Klik Tujuan
                                    </button>
                                </div>

                                {/* Origin Input with Autocomplete */}
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <span className="text-emerald-600 font-bold">●</span> Titik Awal (Origin)
                                        </span>
                                        {originCoords && (
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {originCoords[0].toFixed(4)}, {originCoords[1].toFixed(4)}
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-emerald-600 pointer-events-none">
                                            <MapPin className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={originText}
                                            onChange={(e) => handleSearchGeocode(e.target.value, 'origin')}
                                            placeholder="Ketik nama tempat atau klik peta..."
                                            className="w-full pl-9 pr-16 py-2 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                                        />
                                        <div className="absolute right-1.5 flex items-center gap-0.5">
                                            {originText && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOriginCoords(null);
                                                        setOriginText('');
                                                        if (markerOriginRef.current && mapInstanceRef.current) {
                                                            mapInstanceRef.current.removeLayer(markerOriginRef.current);
                                                            markerOriginRef.current = null;
                                                        }
                                                        clearRouteLayers();
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                                    title="Hapus titik"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={handleMyLocation}
                                                className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                                title="Gunakan Lokasi GPS Saya"
                                            >
                                                <Crosshair className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {/* Origin Dropdown Suggestions */}
                                    {originSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto z-[1050]">
                                            {originSuggestions.map((feat, idx) => {
                                                const p = feat.properties;
                                                const name = p.name || p.street || 'Lokasi';
                                                const d = [p.street, p.city, p.country].filter(Boolean).join(', ');
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleSelectSuggestion(feat, 'origin')}
                                                        className="px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 transition text-left"
                                                    >
                                                        <div className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3 text-gray-400" /> {name}
                                                        </div>
                                                        {d && <div className="text-[10px] text-gray-500 pl-4 truncate">{d}</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Swap Origin / Destination */}
                                <div className="flex justify-center -my-1">
                                    <button
                                        type="button"
                                        onClick={handleSwapRoute}
                                        className="p-1.5 rounded-full bg-gray-100 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 border border-gray-200 transition shadow-2xs"
                                        title="Tukar Titik Awal & Tujuan"
                                    >
                                        <RotateCw className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Destination Input with Autocomplete */}
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                                        <span className="flex items-center gap-1">
                                            <span className="text-rose-600 font-bold">●</span> Titik Tujuan (Destination)
                                        </span>
                                        {destCoords && (
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {destCoords[0].toFixed(4)}, {destCoords[1].toFixed(4)}
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-rose-500 pointer-events-none">
                                            <Navigation className="w-4 h-4" />
                                        </span>
                                        <input
                                            type="text"
                                            value={destText}
                                            onChange={(e) => handleSearchGeocode(e.target.value, 'destination')}
                                            placeholder="Ketik nama tempat atau klik peta..."
                                            className="w-full pl-9 pr-8 py-2 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                                        />
                                        {destText && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDestCoords(null);
                                                    setDestText('');
                                                    if (markerDestRef.current && mapInstanceRef.current) {
                                                        mapInstanceRef.current.removeLayer(markerDestRef.current);
                                                        markerDestRef.current = null;
                                                    }
                                                    clearRouteLayers();
                                                }}
                                                className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                                                title="Hapus titik"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    {/* Destination Dropdown Suggestions */}
                                    {destSuggestions.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto z-[1050]">
                                            {destSuggestions.map((feat, idx) => {
                                                const p = feat.properties;
                                                const name = p.name || p.street || 'Lokasi';
                                                const d = [p.street, p.city, p.country].filter(Boolean).join(', ');
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleSelectSuggestion(feat, 'destination')}
                                                        className="px-3 py-2 hover:bg-rose-50 cursor-pointer border-b border-gray-50 last:border-0 transition text-left"
                                                    >
                                                        <div className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3 text-gray-400" /> {name}
                                                        </div>
                                                        {d && <div className="text-[10px] text-gray-500 pl-4 truncate">{d}</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Calculate & Reset Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        disabled={isRouting || !originCoords || !destCoords}
                                        onClick={calculateRoute}
                                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                                    >
                                        <Navigation className="w-3.5 h-3.5" />
                                        <span>{isRouting ? 'Mencari rute...' : 'Hitung Rute'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetAll}
                                        className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                                        title="Reset Peta & Rute"
                                    >
                                        Reset
                                    </button>
                                </div>

                                {/* Route Summary Card */}
                                {routeSummary && (
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3 space-y-2 transition-all">
                                        <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                                            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                                <span>🏁</span> Informasi Rute
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleFocusRoute}
                                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                                            >
                                                Zoom ke Rute
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                                <span className="block text-[10px] text-gray-500 uppercase font-medium">
                                                    Total Jarak
                                                </span>
                                                <span className="font-extrabold text-base text-gray-900">
                                                    {routeSummary.distanceKm}
                                                </span>
                                            </div>
                                            <div className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                                <span className="block text-[10px] text-gray-500 uppercase font-medium">
                                                    Waktu Sepeda
                                                </span>
                                                <span className="font-extrabold text-base text-emerald-700">
                                                    {routeSummary.bikeDuration}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-gray-600 px-1 pt-0.5">
                                            <span>Estimasi kendaraan:</span>
                                            <span className="font-semibold text-gray-800">{routeSummary.carDuration}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Status Helper Notice */}
                                <div className="text-[11px] text-gray-600 bg-gray-50 rounded-lg p-2.5 border border-gray-100 flex items-start gap-1.5">
                                    <span className="text-emerald-600 font-bold">ℹ</span>
                                    <span>{statusNotice}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
