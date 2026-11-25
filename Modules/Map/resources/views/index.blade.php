<x-app-layout>
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>

    <style>
        #bikepathMap {
            height: calc(100vh - 65px);
            width: 100%;
            z-index: 1;
        }

        /* Marker Pin Styling menggunakan DivIcon */
        .custom-route-pin {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px !important;
            height: 34px !important;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);
            cursor: grab;
            transition: transform 0.15s ease;
        }
        .custom-route-pin:active {
            cursor: grabbing;
            transform: rotate(-45deg) scale(1.15);
        }
        .custom-route-pin span {
            transform: rotate(45deg);
            color: #ffffff;
            font-weight: 700;
            font-size: 13px;
            user-select: none;
        }
        .pin-origin {
            background: linear-gradient(135deg, #10b981, #059669);
            border: 2px solid #ffffff;
        }
        .pin-destination {
            background: linear-gradient(135deg, #ef4444, #b91c1c);
            border: 2px solid #ffffff;
        }

        /* Scrollbar custom untuk dropdown dan panel */
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    </style>

    <!-- Map & Floating Panel Container -->
    <div class="relative w-full overflow-hidden">
        <!-- Peta Leaflet -->
        <div id="bikepathMap"></div>

        <!-- Floating Routing & Geocoding Panel -->
        <div class="absolute top-4 left-4 z-[1000] w-[calc(100%-2rem)] sm:w-[400px]">
            <div class="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden">
                
                <!-- Panel Header -->
                <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
                    <div class="flex items-center gap-2.5">
                        <div class="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-lg">
                            🚴
                        </div>
                        <div>
                            <h3 class="font-bold text-sm tracking-tight">Rute & Navigasi Sepeda</h3>
                            <p class="text-xs text-emerald-100">OSRM Engine + Autocomplete</p>
                        </div>
                    </div>
                    <button type="button" id="btnTogglePanel" class="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition" title="Minimize / Expand Panel">
                        <svg id="iconPanelExpand" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                </div>

                <!-- Panel Body (Collapsible) -->
                <div id="panelContent" class="p-4 space-y-3.5 max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
                    
                    <!-- Mode Pemilihan Klik di Peta -->
                    <div class="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200/80">
                        <button type="button" id="btnModeOrigin" class="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-white text-emerald-700 shadow-xs border border-emerald-200">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
                            Klik Titik Awal
                        </button>
                        <button type="button" id="btnModeDest" class="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition text-gray-600 hover:text-gray-900">
                            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
                            Klik Tujuan
                        </button>
                    </div>

                    <!-- Input Titik Awal (Origin) -->
                    <div class="relative">
                        <label class="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                            <span class="flex items-center gap-1">
                                <span class="text-emerald-600 font-bold">●</span> Titik Awal (Origin)
                            </span>
                            <span id="originCoordsBadge" class="text-[10px] text-gray-400 font-mono hidden"></span>
                        </label>
                        <div class="relative flex items-center">
                            <span class="absolute left-3 text-emerald-600">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </span>
                            <input type="text" id="originInput" autocomplete="off" placeholder="Ketik nama tempat atau klik peta..." class="w-full pl-9 pr-16 py-2 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition">
                            <div class="absolute right-1.5 flex items-center gap-0.5">
                                <button type="button" id="btnClearOrigin" class="hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg" title="Hapus titik">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                                <button type="button" id="btnMyLocation" class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition" title="Gunakan Lokasi GPS Saya">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </button>
                            </div>
                        </div>
                        <!-- Dropdown Hasil Pencarian Autocomplete Origin -->
                        <div id="originSuggestions" class="hidden absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar z-[1050]"></div>
                    </div>

                    <!-- Tombol Swap / Balikkan Arah -->
                    <div class="flex justify-center -my-1">
                        <button type="button" id="btnSwapRoute" class="p-1.5 rounded-full bg-gray-100 hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 border border-gray-200 transition shadow-2xs" title="Tukar Titik Awal & Tujuan">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                        </button>
                    </div>

                    <!-- Input Titik Tujuan (Destination) -->
                    <div class="relative">
                        <label class="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                            <span class="flex items-center gap-1">
                                <span class="text-rose-600 font-bold">●</span> Titik Tujuan (Destination)
                            </span>
                            <span id="destCoordsBadge" class="text-[10px] text-gray-400 font-mono hidden"></span>
                        </label>
                        <div class="relative flex items-center">
                            <span class="absolute left-3 text-rose-500">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg>
                            </span>
                            <input type="text" id="destInput" autocomplete="off" placeholder="Ketik nama tempat atau klik peta..." class="w-full pl-9 pr-8 py-2 text-xs text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition">
                            <button type="button" id="btnClearDest" class="hidden absolute right-2 p-1 text-gray-400 hover:text-gray-600 rounded-lg" title="Hapus titik">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <!-- Dropdown Hasil Pencarian Autocomplete Destination -->
                        <div id="destSuggestions" class="hidden absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar z-[1050]"></div>
                    </div>

                    <!-- Tombol Aksi: Buat Rute & Reset -->
                    <div class="flex items-center gap-2 pt-1">
                        <button type="button" id="btnCalculateRoute" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                            <span id="btnRouteText">Hitung Rute</span>
                        </button>
                        <button type="button" id="btnResetRoute" class="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition" title="Reset / Hapus Rute">
                            Reset
                        </button>
                    </div>

                    <!-- Card Informasi Ringkasan Rute (Muncul saat rute berhasil ditemukan) -->
                    <div id="routeSummaryCard" class="hidden bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5 transition-all">
                        <div class="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                            <span class="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                <span>🏁</span> Informasi Rute
                            </span>
                            <button type="button" id="btnFocusRoute" class="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline" title="Fokus tampilan ke seluruh rute">
                                Zoom ke Rute
                            </button>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-center">
                            <div class="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                <span class="block text-[10px] text-gray-500 uppercase font-medium tracking-wide">Total Jarak</span>
                                <span id="routeDistance" class="font-extrabold text-base text-gray-900">-</span>
                            </div>
                            <div class="bg-white/80 p-2 rounded-lg border border-emerald-100">
                                <span class="block text-[10px] text-gray-500 uppercase font-medium tracking-wide">Waktu Tempuh (Sepeda)</span>
                                <span id="routeDurationBike" class="font-extrabold text-base text-emerald-700">-</span>
                            </div>
                        </div>
                        <div class="flex items-center justify-between text-[11px] text-gray-600 px-1 pt-1">
                            <span>Estimasi kendaraan:</span>
                            <span id="routeDurationCar" class="font-semibold text-gray-800">-</span>
                        </div>
                    </div>

                    <!-- Info Alert / Status Helper -->
                    <div id="routeStatusNotice" class="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 border border-gray-100 flex items-start gap-1.5">
                        <span class="text-emerald-600 font-bold">ℹ</span>
                        <span>Klik peta langsung untuk menaruh titik atau drag ikon marker untuk memperbarui rute.</span>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

    <!-- JavaScript Routing Feature (OSRM + Photon Geocoding) -->
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            // ==========================================
            // 1. Inisialisasi Peta Leaflet (Base Map)
            // ==========================================
            const defaultCoords = [-6.2088, 106.8456]; // Pusat default: Jakarta
            const defaultZoom = 13;

            const map = L.map('bikepathMap', {
                zoomControl: false // Dipindahkan ke kanan bawah agar tidak bertumpukan dengan panel
            }).setView(defaultCoords, defaultZoom);

            // Tambahkan kontrol zoom di posisi kanan bawah
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Tambahkan Tile Layer OpenStreetMap standar (100% gratis & open-source)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
            }).addTo(map);

            // ==========================================
            // 2. State & Variabel Navigasi Rute
            // ==========================================
            let originCoords = null;      // [lat, lng]
            let destCoords = null;        // [lat, lng]
            let markerOrigin = null;      // Leaflet Marker instance
            let markerDest = null;        // Leaflet Marker instance
            let routeLayer = null;        // Leaflet GeoJSON Layer
            let routeCasingLayer = null;  // Outer border line for route
            let activeMode = 'origin';    // 'origin' atau 'destination'
            let searchDebounceTimeout = null;

            // DOM Elements
            const originInput = document.getElementById('originInput');
            const destInput = document.getElementById('destInput');
            const originSuggestions = document.getElementById('originSuggestions');
            const destSuggestions = document.getElementById('destSuggestions');
            const originCoordsBadge = document.getElementById('originCoordsBadge');
            const destCoordsBadge = document.getElementById('destCoordsBadge');
            const btnClearOrigin = document.getElementById('btnClearOrigin');
            const btnClearDest = document.getElementById('btnClearDest');
            const btnModeOrigin = document.getElementById('btnModeOrigin');
            const btnModeDest = document.getElementById('btnModeDest');
            const btnCalculateRoute = document.getElementById('btnCalculateRoute');
            const btnRouteText = document.getElementById('btnRouteText');
            const btnResetRoute = document.getElementById('btnResetRoute');
            const btnSwapRoute = document.getElementById('btnSwapRoute');
            const btnMyLocation = document.getElementById('btnMyLocation');
            const routeSummaryCard = document.getElementById('routeSummaryCard');
            const routeDistance = document.getElementById('routeDistance');
            const routeDurationBike = document.getElementById('routeDurationBike');
            const routeDurationCar = document.getElementById('routeDurationCar');
            const btnFocusRoute = document.getElementById('btnFocusRoute');
            const routeStatusNotice = document.getElementById('routeStatusNotice');
            const btnTogglePanel = document.getElementById('btnTogglePanel');
            const panelContent = document.getElementById('panelContent');

            // ==========================================
            // 3. Custom Marker Pins (L.divIcon)
            // ==========================================
            function createPinIcon(type, label) {
                return L.divIcon({
                    className: 'custom-pin-wrapper',
                    html: `<div class="custom-route-pin ${type === 'origin' ? 'pin-origin' : 'pin-destination'}"><span>${label}</span></div>`,
                    iconSize: [34, 34],
                    iconAnchor: [17, 34],
                    popupAnchor: [0, -34]
                });
            }

            // ==========================================
            // 4. Panel Minimize / Collapse Toggle
            // ==========================================
            btnTogglePanel.addEventListener('click', () => {
                panelContent.classList.toggle('hidden');
                document.getElementById('iconPanelExpand').classList.toggle('rotate-180');
            });

            // ==========================================
            // 5. Mode Selection (Klik Titik Awal vs Tujuan)
            // ==========================================
            function setActiveMode(mode) {
                activeMode = mode;
                if (mode === 'origin') {
                    btnModeOrigin.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-white text-emerald-700 shadow-xs border border-emerald-200';
                    btnModeDest.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition text-gray-600 hover:text-gray-900';
                    routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">●</span><span>Mode aktif: <strong>Titik Awal</strong>. Klik di peta untuk menaruh lokasi awal.</span>';
                } else {
                    btnModeDest.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-white text-rose-700 shadow-xs border border-rose-200';
                    btnModeOrigin.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition text-gray-600 hover:text-gray-900';
                    routeStatusNotice.innerHTML = '<span class="text-rose-600 font-bold">●</span><span>Mode aktif: <strong>Titik Tujuan</strong>. Klik di peta untuk menaruh tujuan akhir.</span>';
                }
            }

            btnModeOrigin.addEventListener('click', () => setActiveMode('origin'));
            btnModeDest.addEventListener('click', () => setActiveMode('destination'));

            // ==========================================
            // 6. Klik Peta untuk Set Marker
            // ==========================================
            map.on('click', function (e) {
                const { lat, lng } = e.latlng;

                if (activeMode === 'origin') {
                    setOrigin([lat, lng], `Titik Terpilih (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                    // Otomatis arahkan ke penentuan titik tujuan jika belum ada
                    if (!destCoords) {
                        setActiveMode('destination');
                    } else {
                        calculateRoute();
                    }
                } else {
                    setDestination([lat, lng], `Titik Terpilih (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                    if (originCoords) {
                        calculateRoute();
                    }
                }
            });

            // ==========================================
            // 7. Fungsi Set Titik Awal & Titik Tujuan
            // ==========================================
            function setOrigin(latLng, displayName) {
                originCoords = latLng;
                originInput.value = displayName;
                btnClearOrigin.classList.remove('hidden');
                originCoordsBadge.classList.remove('hidden');
                originCoordsBadge.textContent = `${latLng[0].toFixed(4)}, ${latLng[1].toFixed(4)}`;

                if (markerOrigin) {
                    markerOrigin.setLatLng(latLng);
                } else {
                    markerOrigin = L.marker(latLng, {
                        icon: createPinIcon('origin', 'A'),
                        draggable: true
                    }).addTo(map);

                    markerOrigin.bindPopup('<strong>Titik Awal (Origin)</strong><br><small>Geser pin untuk memindahkan</small>');

                    // Drag marker untuk perbarui rute otomatis
                    markerOrigin.on('dragend', function (event) {
                        const newPos = event.target.getLatLng();
                        originCoords = [newPos.lat, newPos.lng];
                        originCoordsBadge.textContent = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
                        originInput.value = `Posisi Pin (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})`;
                        if (destCoords) calculateRoute();
                    });
                }
            }

            function setDestination(latLng, displayName) {
                destCoords = latLng;
                destInput.value = displayName;
                btnClearDest.classList.remove('hidden');
                destCoordsBadge.classList.remove('hidden');
                destCoordsBadge.textContent = `${latLng[0].toFixed(4)}, ${latLng[1].toFixed(4)}`;

                if (markerDest) {
                    markerDest.setLatLng(latLng);
                } else {
                    markerDest = L.marker(latLng, {
                        icon: createPinIcon('destination', 'B'),
                        draggable: true
                    }).addTo(map);

                    markerDest.bindPopup('<strong>Titik Tujuan (Destination)</strong><br><small>Geser pin untuk memindahkan</small>');

                    // Drag marker untuk perbarui rute otomatis
                    markerDest.on('dragend', function (event) {
                        const newPos = event.target.getLatLng();
                        destCoords = [newPos.lat, newPos.lng];
                        destCoordsBadge.textContent = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
                        destInput.value = `Posisi Pin (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})`;
                        if (originCoords) calculateRoute();
                    });
                }
            }

            // ==========================================
            // 8. Hapus / Reset Tombol Input Individual
            // ==========================================
            btnClearOrigin.addEventListener('click', () => {
                originCoords = null;
                originInput.value = '';
                btnClearOrigin.classList.add('hidden');
                originCoordsBadge.classList.add('hidden');
                if (markerOrigin) {
                    map.removeLayer(markerOrigin);
                    markerOrigin = null;
                }
                clearRouteLayers();
                setActiveMode('origin');
            });

            btnClearDest.addEventListener('click', () => {
                destCoords = null;
                destInput.value = '';
                btnClearDest.classList.add('hidden');
                destCoordsBadge.classList.add('hidden');
                if (markerDest) {
                    map.removeLayer(markerDest);
                    markerDest = null;
                }
                clearRouteLayers();
                setActiveMode('destination');
            });

            // ==========================================
            // 9. Tombol Tukar Posisi (Swap Origin & Destination)
            // ==========================================
            btnSwapRoute.addEventListener('click', () => {
                if (!originCoords && !destCoords) return;

                const tempCoords = originCoords;
                const tempName = originInput.value;

                if (destCoords) {
                    setOrigin(destCoords, destInput.value);
                } else {
                    originCoords = null;
                    originInput.value = '';
                    if (markerOrigin) { map.removeLayer(markerOrigin); markerOrigin = null; }
                }

                if (tempCoords) {
                    setDestination(tempCoords, tempName);
                } else {
                    destCoords = null;
                    destInput.value = '';
                    if (markerDest) { map.removeLayer(markerDest); markerDest = null; }
                }

                if (originCoords && destCoords) {
                    calculateRoute();
                } else {
                    clearRouteLayers();
                }
            });

            // ==========================================
            // 10. Geolocation (Gunakan Lokasi GPS Saya)
            // ==========================================
            btnMyLocation.addEventListener('click', () => {
                if (!navigator.geolocation) {
                    alert('Browser Anda tidak mendukung Geolocation.');
                    return;
                }

                btnMyLocation.classList.add('animate-spin');
                routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">⏳</span><span>Mendeteksi lokasi GPS Anda...</span>';

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        btnMyLocation.classList.remove('animate-spin');
                        const userLat = position.coords.latitude;
                        const userLng = position.coords.longitude;
                        const userCoords = [userLat, userLng];

                        setOrigin(userCoords, 'Lokasi GPS Saya');
                        map.setView(userCoords, 15);

                        if (!destCoords) {
                            setActiveMode('destination');
                        } else {
                            calculateRoute();
                        }
                    },
                    (error) => {
                        btnMyLocation.classList.remove('animate-spin');
                        let msg = 'Gagal mengambil lokasi GPS.';
                        if (error.code === error.PERMISSION_DENIED) {
                            msg = 'Izin akses lokasi ditolak oleh browser.';
                        }
                        alert(msg);
                        routeStatusNotice.innerHTML = `<span class="text-rose-600 font-bold">⚠</span><span>${msg}</span>`;
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            });

            // ==========================================
            // 11. Autocomplete / Geocoding (Photon Komoot API)
            // ==========================================
            function setupAutocomplete(inputElement, dropdownElement, onSelectCallback) {
                inputElement.addEventListener('input', function () {
                    const query = this.value.trim();
                    clearTimeout(searchDebounceTimeout);

                    if (query.length < 2) {
                        dropdownElement.innerHTML = '';
                        dropdownElement.classList.add('hidden');
                        return;
                    }

                    searchDebounceTimeout = setTimeout(() => {
                        // Gunakan pusat peta saat ini sebagai bias lokasi agar pencarian lebih akurat
                        const center = map.getCenter();
                        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${center.lat}&lon=${center.lng}&limit=5&lang=id`;

                        fetch(url)
                            .then(res => res.json())
                            .then(data => {
                                dropdownElement.innerHTML = '';
                                if (!data.features || data.features.length === 0) {
                                    dropdownElement.innerHTML = '<div class="p-2.5 text-xs text-gray-500 text-center">Lokasi tidak ditemukan</div>';
                                    dropdownElement.classList.remove('hidden');
                                    return;
                                }

                                data.features.forEach(feature => {
                                    const props = feature.properties;
                                    const coords = feature.geometry.coordinates; // [lng, lat]
                                    const title = props.name || props.street || 'Lokasi tanpa nama';
                                    const details = [props.street, props.district, props.city, props.state, props.country]
                                        .filter(Boolean)
                                        .filter(item => item !== title)
                                        .slice(0, 3)
                                        .join(', ');

                                    const item = document.createElement('div');
                                    item.className = 'px-3 py-2 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-0 transition';
                                    item.innerHTML = `
                                        <div class="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                                            <span class="text-gray-400">📍</span> ${escapeHtml(title)}
                                        </div>
                                        ${details ? `<div class="text-[10px] text-gray-500 pl-4 truncate">${escapeHtml(details)}</div>` : ''}
                                    `;

                                    item.addEventListener('click', () => {
                                        const latLng = [coords[1], coords[0]];
                                        const fullDisplayName = details ? `${title}, ${details}` : title;
                                        onSelectCallback(latLng, fullDisplayName);
                                        dropdownElement.innerHTML = '';
                                        dropdownElement.classList.add('hidden');
                                    });

                                    dropdownElement.appendChild(item);
                                });
                                dropdownElement.classList.remove('hidden');
                            })
                            .catch(err => {
                                console.error('Geocoding error:', err);
                            });
                    }, 300);
                });

                // Tutup dropdown saat klik di luar
                document.addEventListener('click', (e) => {
                    if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
                        dropdownElement.classList.add('hidden');
                    }
                });
            }

            setupAutocomplete(originInput, originSuggestions, (latLng, name) => {
                setOrigin(latLng, name);
                map.setView(latLng, 15);
                if (!destCoords) {
                    setActiveMode('destination');
                } else {
                    calculateRoute();
                }
            });

            setupAutocomplete(destInput, destSuggestions, (latLng, name) => {
                setDestination(latLng, name);
                map.setView(latLng, 15);
                if (originCoords) {
                    calculateRoute();
                }
            });

            // ==========================================
            // 12. Routing Engine (OSRM Public API + L.geoJSON)
            // ==========================================
            btnCalculateRoute.addEventListener('click', calculateRoute);

            function calculateRoute() {
                if (!originCoords || !destCoords) {
                    alert('Silakan tentukan Titik Awal dan Titik Tujuan terlebih dahulu.');
                    return;
                }

                btnRouteText.textContent = 'Mencari rute...';
                btnCalculateRoute.classList.add('opacity-75', 'pointer-events-none');
                routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">⏳</span><span>Menghubungi OSRM engine untuk mencari rute terbaik...</span>';

                // OSRM format koordinat: {lon},{lat};{lon},{lat}
                const originLngLat = `${originCoords[1]},${originCoords[0]}`;
                const destLngLat = `${destCoords[1]},${destCoords[0]}`;
                const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLngLat};${destLngLat}?overview=full&geometries=geojson&steps=true`;

                fetch(osrmUrl)
                    .then(response => {
                        if (!response.ok) throw new Error('Respon OSRM gagal: ' + response.statusText);
                        return response.json();
                    })
                    .then(data => {
                        btnRouteText.textContent = 'Hitung Rute';
                        btnCalculateRoute.classList.remove('opacity-75', 'pointer-events-none');

                        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                            alert('Tidak dapat menemukan rute jalan antara kedua titik tersebut.');
                            routeStatusNotice.innerHTML = '<span class="text-rose-600 font-bold">⚠</span><span>Tidak ada rute yang terhubung di jaringan jalan.</span>';
                            return;
                        }

                        const route = data.routes[0];
                        drawRoute(route.geometry);
                        displayRouteSummary(route.distance, route.duration);
                    })
                    .catch(error => {
                        console.error('Routing Error:', error);
                        btnRouteText.textContent = 'Hitung Rute';
                        btnCalculateRoute.classList.remove('opacity-75', 'pointer-events-none');
                        alert('Gagal menghubungkan ke server OSRM. Pastikan koneksi internet aktif.');
                        routeStatusNotice.innerHTML = '<span class="text-rose-600 font-bold">⚠</span><span>Gagal memuat rute dari server OSRM.</span>';
                    });
            }

            function drawRoute(geoJsonGeometry) {
                clearRouteLayers();

                // 1. Layer Bayangan / Border luar rute (agar kontras di atas peta apa pun)
                routeCasingLayer = L.geoJSON(geoJsonGeometry, {
                    style: {
                        color: '#064e3b', // Emerald sangat gelap sebagai border
                        weight: 8,
                        opacity: 0.6,
                        lineJoin: 'round',
                        lineCap: 'round'
                    }
                }).addTo(map);

                // 2. Layer Utama Rute (Emerald Hijau Khas Bikepath)
                routeLayer = L.geoJSON(geoJsonGeometry, {
                    style: {
                        color: '#10b981', // Emerald 500
                        weight: 5,
                        opacity: 0.95,
                        lineJoin: 'round',
                        lineCap: 'round'
                    }
                }).addTo(map);

                // Fit view ke seluruh rute dengan padding
                map.fitBounds(routeLayer.getBounds(), {
                    padding: [60, 60],
                    maxZoom: 16
                });

                routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">✓</span><span>Rute berhasil dibuat mengikuti jaringan jalan nyata!</span>';
            }

            function displayRouteSummary(distanceMeters, durationSeconds) {
                // Konversi Jarak (Meters ke KM)
                const distanceKm = distanceMeters >= 1000 
                    ? (distanceMeters / 1000).toFixed(2) + ' km' 
                    : Math.round(distanceMeters) + ' m';
                routeDistance.textContent = distanceKm;

                // Estimasi Waktu Bersepeda (Kecepatan rata-rata pesepeda ~18 km/jam)
                const bikeSpeedKmh = 18;
                const bikeTotalHours = (distanceMeters / 1000) / bikeSpeedKmh;
                const bikeTotalMinutes = Math.max(1, Math.round(bikeTotalHours * 60));
                routeDurationBike.textContent = formatDuration(bikeTotalMinutes);

                // Estimasi Waktu Kendaraan Bermotor (dari durasi OSRM)
                const carMinutes = Math.max(1, Math.round(durationSeconds / 60));
                routeDurationCar.textContent = `~${formatDuration(carMinutes)}`;

                routeSummaryCard.classList.remove('hidden');
            }

            function formatDuration(minutes) {
                if (minutes >= 60) {
                    const h = Math.floor(minutes / 60);
                    const m = minutes % 60;
                    return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
                }
                return `${minutes} menit`;
            }

            // Tombol Fokus Zoom ke Rute
            btnFocusRoute.addEventListener('click', () => {
                if (routeLayer) {
                    map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });
                }
            });

            // ==========================================
            // 13. Tombol Reset Keseluruhan Rute
            // ==========================================
            btnResetRoute.addEventListener('click', resetAll);

            function resetAll() {
                originCoords = null;
                destCoords = null;
                originInput.value = '';
                destInput.value = '';
                btnClearOrigin.classList.add('hidden');
                btnClearDest.classList.add('hidden');
                originCoordsBadge.classList.add('hidden');
                destCoordsBadge.classList.add('hidden');
                routeSummaryCard.classList.add('hidden');

                if (markerOrigin) { map.removeLayer(markerOrigin); markerOrigin = null; }
                if (markerDest) { map.removeLayer(markerDest); markerDest = null; }

                clearRouteLayers();
                setActiveMode('origin');
                map.setView(defaultCoords, defaultZoom);
                routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">ℹ</span><span>Peta di-reset. Klik pada peta untuk mulai menentukan titik awal.</span>';
            }

            function clearRouteLayers() {
                if (routeLayer) {
                    map.removeLayer(routeLayer);
                    routeLayer = null;
                }
                if (routeCasingLayer) {
                    map.removeLayer(routeCasingLayer);
                    routeCasingLayer = null;
                }
                routeSummaryCard.classList.add('hidden');
            }

            function escapeHtml(text) {
                if (!text) return '';
                const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
                return text.toString().replace(/[&<>"']/g, m => map[m]);
            }
        });
    </script>
</x-app-layout>
