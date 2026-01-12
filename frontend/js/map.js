// Map Functions
function initHomeMap() {
    const homeMapContainer = document.getElementById('home-hero-map');
    if (!homeMapContainer) return;

    const homeMap = L.map('home-hero-map', {
        center: [28.6139, 77.2090],
        zoom: 12,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors'
    }).addTo(homeMap);

    // Add some pulse markers to home map
    const locations = [
        [28.6139, 77.2090], [28.6328, 77.2197], [28.5355, 77.3910],
        [28.5843, 77.2028], [28.6507, 77.2334]
    ];

    locations.forEach(loc => {
        L.circleMarker(loc, {
            radius: 6,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(homeMap);
    });
}

function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || map) return;

    map = L.map('map', {
        minZoom: 10
    }).setView([28.6139, 77.2090], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add Circular Boundary for Delhi Region
    L.circle([28.6139, 77.2090], {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.05,
        radius: 25000 // 25km radius covering Delhi NCT
    }).addTo(map);
    updateZoneMarkers();
}

function updateZoneMarkers(filteredZones = null) {
    if (!map) return;
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const zonesToRender = filteredZones || parkingZones;

    zonesToRender.forEach(zone => {
        const fillPercent = Math.min(100, (zone.currentOccupancy / zone.totalCapacity) * 100);
        const color = fillPercent > 90 ? '#e53e3e' : (fillPercent > 70 ? '#f6ad55' : '#38a169');
        
        const marker = L.circleMarker([zone.latitude, zone.longitude], {
            radius: 10,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).bindPopup(`
            <div class=\"map-popup\">
                <h3>${zone.name}</h3>
                <p><i class=\"fas fa-map-marker-alt\"></i> ${zone.address}</p>
                <div class=\"popup-stats\">
                    <div class=\"stat-box\">
                        <span>Occupancy</span>
                        <strong>${zone.currentOccupancy}/${zone.totalCapacity}</strong>
                    </div>
                </div>
                <div style=\"height: 4px; background: #eee; border-radius: 2px; margin-top: 10px;\">
                    <div style=\"width: ${fillPercent}%; height: 100%; background: ${color}; border-radius: 2px;\"></div>
                </div>
            </div>
        `);
        marker.addTo(map);
        markers.push(marker);
    });

    if (zonesToRender.length > 0 && filteredZones) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

let searchTimeout = null;
let searchMarker = null;

function handleMapSearch() {
    const input = document.getElementById('map-search');
    if (!input) return;
    
    const query = input.value.toLowerCase().trim();
    
    // 1. Local Filter (Instant)
    if (!query) {
        updateZoneMarkers(parkingZones);
        if (searchMarker) map.removeLayer(searchMarker);
        return;
    }

    const filtered = parkingZones.filter(zone => 
        (zone.name && zone.name.toLowerCase().includes(query)) || 
        (zone.address && zone.address.toLowerCase().includes(query))
    );
    updateZoneMarkers(filtered);

    // 2. External Geocoding (Debounced to 1s)
    if (searchTimeout) clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {
        if (query.length < 3) return;

        try {
            // Search strictly within Delhi bounds
            const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' Delhi')}&limit=1&viewbox=76.84,28.88,77.35,28.40&bounded=1`;
            
            const res = await fetch(endpoint);
            const data = await res.json();

            if (data && data.length > 0) {
                const place = data[0];
                const lat = parseFloat(place.lat);
                const lon = parseFloat(place.lon);

                // Update Search Marker
                if (searchMarker) map.removeLayer(searchMarker);
                
                searchMarker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'custom-pin',
                        html: '<div style="background-color: #3182ce; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16]
                    })
                }).addTo(map).bindPopup(`
                    <div style="font-size:12px;">
                        <strong>Found Location</strong><br>
                        ${place.display_name.split(',')[0]}
                    </div>
                `).openPopup();

                // Fly to location
                map.flyTo([lat, lon], 14, { duration: 1.5 });
            }
        } catch (e) {
            console.error('Geocoding error:', e);
        }
    }, 1000);
}
