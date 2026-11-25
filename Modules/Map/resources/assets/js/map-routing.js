/**
 * BikePath Routing & Geocoding Module
 * Engine: OSRM (Open Source Routing Machine) + Photon Geocoder
 * Architecture: Laravel HMVC (nwidart/laravel-modules) - Modules/Map
 */

function initBikePathRouting(map, defaultCoords = [-6.2088, 106.8456], defaultZoom = 13) {
    let originCoords = null;      // [lat, lng]
    let destCoords = null;        // [lat, lng]
    let markerOrigin = null;      // Leaflet Marker
    let markerDest = null;        // Leaflet Marker
    let routeLayer = null;        // L.geoJSON route line
    let routeCasingLayer = null;  // L.geoJSON casing line
    let activeMode = 'origin';    // 'origin' | 'destination'
    let searchDebounceTimeout = null;

    // Elements
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

    // Marker Pin Icon Generator
    function createPinIcon(type, label) {
        return L.divIcon({
            className: 'custom-pin-wrapper',
            html: `<div class="custom-route-pin ${type === 'origin' ? 'pin-origin' : 'pin-destination'}"><span>${label}</span></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34]
        });
    }

    // Toggle Panel Collapse
    if (btnTogglePanel && panelContent) {
        btnTogglePanel.addEventListener('click', () => {
            panelContent.classList.toggle('hidden');
            const icon = document.getElementById('iconPanelExpand');
            if (icon) icon.classList.toggle('rotate-180');
        });
    }

    // Mode Toggle
    function setActiveMode(mode) {
        activeMode = mode;
        if (mode === 'origin') {
            if (btnModeOrigin) btnModeOrigin.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-white text-emerald-700 shadow-xs border border-emerald-200';
            if (btnModeDest) btnModeDest.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition text-gray-600 hover:text-gray-900';
            if (routeStatusNotice) routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">●</span><span>Mode aktif: <strong>Titik Awal</strong>. Klik di peta untuk menaruh lokasi awal.</span>';
        } else {
            if (btnModeDest) btnModeDest.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition bg-white text-rose-700 shadow-xs border border-rose-200';
            if (btnModeOrigin) btnModeOrigin.className = 'flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition text-gray-600 hover:text-gray-900';
            if (routeStatusNotice) routeStatusNotice.innerHTML = '<span class="text-rose-600 font-bold">●</span><span>Mode aktif: <strong>Titik Tujuan</strong>. Klik di peta untuk menaruh tujuan akhir.</span>';
        }
    }

    if (btnModeOrigin) btnModeOrigin.addEventListener('click', () => setActiveMode('origin'));
    if (btnModeDest) btnModeDest.addEventListener('click', () => setActiveMode('destination'));

    // Map Click
    map.on('click', function (e) {
        const { lat, lng } = e.latlng;
        if (activeMode === 'origin') {
            setOrigin([lat, lng], `Titik Terpilih (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
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

    // Set Origin
    function setOrigin(latLng, displayName) {
        originCoords = latLng;
        if (originInput) originInput.value = displayName;
        if (btnClearOrigin) btnClearOrigin.classList.remove('hidden');
        if (originCoordsBadge) {
            originCoordsBadge.classList.remove('hidden');
            originCoordsBadge.textContent = `${latLng[0].toFixed(4)}, ${latLng[1].toFixed(4)}`;
        }

        if (markerOrigin) {
            markerOrigin.setLatLng(latLng);
        } else {
            markerOrigin = L.marker(latLng, {
                icon: createPinIcon('origin', 'A'),
                draggable: true
            }).addTo(map);

            markerOrigin.bindPopup('<strong>Titik Awal (Origin)</strong><br><small>Geser pin untuk memindahkan</small>');

            markerOrigin.on('dragend', function (event) {
                const newPos = event.target.getLatLng();
                originCoords = [newPos.lat, newPos.lng];
                if (originCoordsBadge) originCoordsBadge.textContent = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
                if (originInput) originInput.value = `Posisi Pin (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})`;
                if (destCoords) calculateRoute();
            });
        }
    }

    // Set Destination
    function setDestination(latLng, displayName) {
        destCoords = latLng;
        if (destInput) destInput.value = displayName;
        if (btnClearDest) btnClearDest.classList.remove('hidden');
        if (destCoordsBadge) {
            destCoordsBadge.classList.remove('hidden');
            destCoordsBadge.textContent = `${latLng[0].toFixed(4)}, ${latLng[1].toFixed(4)}`;
        }

        if (markerDest) {
            markerDest.setLatLng(latLng);
        } else {
            markerDest = L.marker(latLng, {
                icon: createPinIcon('destination', 'B'),
                draggable: true
            }).addTo(map);

            markerDest.bindPopup('<strong>Titik Tujuan (Destination)</strong><br><small>Geser pin untuk memindahkan</small>');

            markerDest.on('dragend', function (event) {
                const newPos = event.target.getLatLng();
                destCoords = [newPos.lat, newPos.lng];
                if (destCoordsBadge) destCoordsBadge.textContent = `${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)}`;
                if (destInput) destInput.value = `Posisi Pin (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})`;
                if (originCoords) calculateRoute();
            });
        }
    }

    // Clear Inputs
    if (btnClearOrigin) {
        btnClearOrigin.addEventListener('click', () => {
            originCoords = null;
            if (originInput) originInput.value = '';
            btnClearOrigin.classList.add('hidden');
            if (originCoordsBadge) originCoordsBadge.classList.add('hidden');
            if (markerOrigin) { map.removeLayer(markerOrigin); markerOrigin = null; }
            clearRouteLayers();
            setActiveMode('origin');
        });
    }

    if (btnClearDest) {
        btnClearDest.addEventListener('click', () => {
            destCoords = null;
            if (destInput) destInput.value = '';
            btnClearDest.classList.add('hidden');
            if (destCoordsBadge) destCoordsBadge.classList.add('hidden');
            if (markerDest) { map.removeLayer(markerDest); markerDest = null; }
            clearRouteLayers();
            setActiveMode('destination');
        });
    }

    // Swap Origin & Destination
    if (btnSwapRoute) {
        btnSwapRoute.addEventListener('click', () => {
            if (!originCoords && !destCoords) return;
            const tempCoords = originCoords;
            const tempName = originInput ? originInput.value : '';

            if (destCoords) {
                setOrigin(destCoords, destInput.value);
            } else {
                originCoords = null;
                if (originInput) originInput.value = '';
                if (markerOrigin) { map.removeLayer(markerOrigin); markerOrigin = null; }
            }

            if (tempCoords) {
                setDestination(tempCoords, tempName);
            } else {
                destCoords = null;
                if (destInput) destInput.value = '';
                if (markerDest) { map.removeLayer(markerDest); markerDest = null; }
            }

            if (originCoords && destCoords) calculateRoute();
            else clearRouteLayers();
        });
    }

    // GPS Geolocation
    if (btnMyLocation) {
        btnMyLocation.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Browser Anda tidak mendukung Geolocation.');
                return;
            }
            btnMyLocation.classList.add('animate-spin');
            if (routeStatusNotice) routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">⏳</span><span>Mendeteksi lokasi GPS Anda...</span>';

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    btnMyLocation.classList.remove('animate-spin');
                    const coords = [pos.coords.latitude, pos.coords.longitude];
                    setOrigin(coords, 'Lokasi GPS Saya');
                    map.setView(coords, 15);
                    if (!destCoords) setActiveMode('destination');
                    else calculateRoute();
                },
                (err) => {
                    btnMyLocation.classList.remove('animate-spin');
                    const msg = err.code === 1 ? 'Izin akses lokasi ditolak.' : 'Gagal mengambil lokasi GPS.';
                    alert(msg);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    // Autocomplete (Photon API)
    function setupAutocomplete(inputElement, dropdownElement, onSelectCallback) {
        if (!inputElement || !dropdownElement) return;

        inputElement.addEventListener('input', function () {
            const query = this.value.trim();
            clearTimeout(searchDebounceTimeout);

            if (query.length < 2) {
                dropdownElement.innerHTML = '';
                dropdownElement.classList.add('hidden');
                return;
            }

            searchDebounceTimeout = setTimeout(() => {
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
                            const coords = feature.geometry.coordinates;
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
                    .catch(err => console.error('Geocoding error:', err));
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
                dropdownElement.classList.add('hidden');
            }
        });
    }

    setupAutocomplete(originInput, originSuggestions, (latLng, name) => {
        setOrigin(latLng, name);
        map.setView(latLng, 15);
        if (!destCoords) setActiveMode('destination');
        else calculateRoute();
    });

    setupAutocomplete(destInput, destSuggestions, (latLng, name) => {
        setDestination(latLng, name);
        map.setView(latLng, 15);
        if (originCoords) calculateRoute();
    });

    // OSRM Route Calculation
    if (btnCalculateRoute) btnCalculateRoute.addEventListener('click', calculateRoute);

    function calculateRoute() {
        if (!originCoords || !destCoords) {
            alert('Silakan tentukan Titik Awal dan Titik Tujuan terlebih dahulu.');
            return;
        }

        if (btnRouteText) btnRouteText.textContent = 'Mencari rute...';
        if (btnCalculateRoute) btnCalculateRoute.classList.add('opacity-75', 'pointer-events-none');
        if (routeStatusNotice) routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">⏳</span><span>Menghubungi OSRM engine untuk mencari rute...</span>';

        const originLngLat = `${originCoords[1]},${originCoords[0]}`;
        const destLngLat = `${destCoords[1]},${destCoords[0]}`;
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLngLat};${destLngLat}?overview=full&geometries=geojson&steps=true`;

        fetch(osrmUrl)
            .then(res => {
                if (!res.ok) throw new Error('OSRM error: ' + res.statusText);
                return res.json();
            })
            .then(data => {
                if (btnRouteText) btnRouteText.textContent = 'Hitung Rute';
                if (btnCalculateRoute) btnCalculateRoute.classList.remove('opacity-75', 'pointer-events-none');

                if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                    alert('Tidak dapat menemukan rute jalan antara kedua titik.');
                    return;
                }

                const route = data.routes[0];
                drawRoute(route.geometry);
                displayRouteSummary(route.distance, route.duration);
            })
            .catch(err => {
                console.error(err);
                if (btnRouteText) btnRouteText.textContent = 'Hitung Rute';
                if (btnCalculateRoute) btnCalculateRoute.classList.remove('opacity-75', 'pointer-events-none');
                alert('Gagal memuat rute dari server OSRM.');
            });
    }

    function drawRoute(geoJsonGeometry) {
        clearRouteLayers();

        routeCasingLayer = L.geoJSON(geoJsonGeometry, {
            style: { color: '#064e3b', weight: 8, opacity: 0.6, lineJoin: 'round', lineCap: 'round' }
        }).addTo(map);

        routeLayer = L.geoJSON(geoJsonGeometry, {
            style: { color: '#10b981', weight: 5, opacity: 0.95, lineJoin: 'round', lineCap: 'round' }
        }).addTo(map);

        map.fitBounds(routeLayer.getBounds(), { padding: [60, 60], maxZoom: 16 });

        if (routeStatusNotice) routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">✓</span><span>Rute berhasil dibuat mengikuti jaringan jalan!</span>';
    }

    function displayRouteSummary(distanceMeters, durationSeconds) {
        const distanceKm = distanceMeters >= 1000 
            ? (distanceMeters / 1000).toFixed(2) + ' km' 
            : Math.round(distanceMeters) + ' m';
        if (routeDistance) routeDistance.textContent = distanceKm;

        const bikeSpeedKmh = 18;
        const bikeTotalHours = (distanceMeters / 1000) / bikeSpeedKmh;
        const bikeTotalMinutes = Math.max(1, Math.round(bikeTotalHours * 60));
        if (routeDurationBike) routeDurationBike.textContent = formatDuration(bikeTotalMinutes);

        const carMinutes = Math.max(1, Math.round(durationSeconds / 60));
        if (routeDurationCar) routeDurationCar.textContent = `~${formatDuration(carMinutes)}`;

        if (routeSummaryCard) routeSummaryCard.classList.remove('hidden');
    }

    function formatDuration(minutes) {
        if (minutes >= 60) {
            const h = Math.floor(minutes / 60);
            const m = minutes % 60;
            return m > 0 ? `${h} jam ${m} mnt` : `${h} jam`;
        }
        return `${minutes} menit`;
    }

    if (btnFocusRoute) {
        btnFocusRoute.addEventListener('click', () => {
            if (routeLayer) map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });
        });
    }

    // Reset All
    if (btnResetRoute) btnResetRoute.addEventListener('click', resetAll);

    function resetAll() {
        originCoords = null;
        destCoords = null;
        if (originInput) originInput.value = '';
        if (destInput) destInput.value = '';
        if (btnClearOrigin) btnClearOrigin.classList.add('hidden');
        if (btnClearDest) btnClearDest.classList.add('hidden');
        if (originCoordsBadge) originCoordsBadge.classList.add('hidden');
        if (destCoordsBadge) destCoordsBadge.classList.add('hidden');
        if (routeSummaryCard) routeSummaryCard.classList.add('hidden');

        if (markerOrigin) { map.removeLayer(markerOrigin); markerOrigin = null; }
        if (markerDest) { map.removeLayer(markerDest); markerDest = null; }

        clearRouteLayers();
        setActiveMode('origin');
        map.setView(defaultCoords, defaultZoom);
        if (routeStatusNotice) routeStatusNotice.innerHTML = '<span class="text-emerald-600 font-bold">ℹ</span><span>Peta di-reset. Klik pada peta untuk mulai menentukan titik awal.</span>';
    }

    function clearRouteLayers() {
        if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
        if (routeCasingLayer) { map.removeLayer(routeCasingLayer); routeCasingLayer = null; }
        if (routeSummaryCard) routeSummaryCard.classList.add('hidden');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.toString().replace(/[&<>"']/g, m => map[m]);
    }
}
