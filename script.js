document.addEventListener('DOMContentLoaded', () => {
    try { initTabs(); } catch(e) { console.error('initTabs error:', e); }
    try { initStationFilters(); } catch(e) { console.error('initStationFilters error:', e); }
    try { initThemeToggle(); } catch(e) { console.error('initThemeToggle error:', e); }
    try { initChecklistStorage(); } catch(e) { console.error('initChecklistStorage error:', e); }
    try { initSimulationControls(); } catch(e) { console.error('initSimulationControls error:', e); }
    try { initInteractiveMap(); } catch(e) { console.error('initInteractiveMap error:', e); }
    try { initTimelineSchedule(); } catch(e) { console.error('initTimelineSchedule error:', e); }
});

/**
 * Tab Navigation Logic
 */
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Deactivate all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate current tab
            btn.classList.add('active');
            const contentElement = document.getElementById(targetTab);
            if (contentElement) {
                contentElement.classList.add('active');
                if (targetTab === 'tab-map' && map) {
                    setTimeout(() => map.invalidateSize(), 200);
                }
                window.scrollTo({ top: contentElement.offsetTop - 120, behavior: 'smooth' });
            }
        });
    });
}

/**
 * Rest Stations Filter Logic
 */
function initStationFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const stationCards = document.querySelectorAll('.station-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            stationCards.forEach(card => {
                const cardSector = card.getAttribute('data-sector');
                if (filterValue === 'all' || cardSector === filterValue) {
                    card.style.display = 'flex';
                    card.style.animation = 'fadeIn 0.3s ease-in-out';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Dark / Light Theme Toggle
 */
function initThemeToggle() {
    const themeBtn = document.getElementById('themeToggle');
    const body = document.body;

    // Load saved theme preference
    const savedTheme = localStorage.getItem('roadtrip_theme') || 'theme-dark';
    body.className = savedTheme;
    updateThemeIcon(savedTheme);

    themeBtn.addEventListener('click', () => {
        if (body.classList.contains('theme-dark')) {
            body.classList.replace('theme-dark', 'theme-light');
            localStorage.setItem('roadtrip_theme', 'theme-light');
            updateThemeIcon('theme-light');
        } else {
            body.classList.replace('theme-light', 'theme-dark');
            localStorage.setItem('roadtrip_theme', 'theme-dark');
            updateThemeIcon('theme-dark');
        }
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        if (theme === 'theme-light') {
            icon.className = 'fa-solid fa-moon';
        } else {
            icon.className = 'fa-solid fa-sun';
        }
    }
}

/**
 * Copy Text to Clipboard Function
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`تم نسخ الرقم (${text}) بنجاح!`);
    }).catch(err => {
        console.error('فشل في نسخ الرقم: ', err);
    });
}

/**
 * Toast Notification Helper
 */
function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.95);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 30px;
            font-family: 'Cairo', sans-serif;
            font-weight: 700;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2500);
}

/**
 * Master Checklist Control, Readiness Gauge & Category Filters
 */
function initChecklistStorage() {
    const checkboxes = document.querySelectorAll('.interactive-checklist input[type="checkbox"]');
    const countVal = document.getElementById('checklistCountVal');
    const progressVal = document.getElementById('checklistProgressVal');
    const progressBar = document.getElementById('checklistProgressBar');
    const readinessBadge = document.getElementById('tripReadinessBadge');
    const readinessStatusText = document.getElementById('readinessStatusText');
    const btnCheckAll = document.getElementById('btnCheckAll');
    const btnUncheckAll = document.getElementById('btnUncheckAll');
    const filterBtns = document.querySelectorAll('.chk-filter-btn');
    const checklistCards = document.querySelectorAll('.checklist-card');

    function updateProgress() {
        const total = checkboxes.length;
        if (total === 0) return;
        
        let checkedCount = 0;
        checkboxes.forEach((cb) => {
            if (cb.checked) checkedCount++;
        });

        const percentage = Math.round((checkedCount / total) * 100);

        if (countVal) countVal.textContent = `${checkedCount} من ${total} مكتمل`;
        if (progressVal) progressVal.textContent = `${percentage}%`;
        if (progressBar) progressBar.style.width = `${percentage}%`;

        // Update Category Specific Progress Pills
        const categories = ['car', 'kid', 'medical', 'food', 'docs'];
        categories.forEach(cat => {
            const card = document.querySelector(`.checklist-card[data-category="${cat}"]`);
            const pill = document.getElementById(`catProg_${cat}`);
            if (card && pill) {
                const catCheckboxes = card.querySelectorAll('input[type="checkbox"]');
                let catChecked = 0;
                catCheckboxes.forEach(c => { if (c.checked) catChecked++; });
                pill.textContent = `${catChecked}/${catCheckboxes.length}`;
                if (catChecked === catCheckboxes.length && catCheckboxes.length > 0) {
                    pill.classList.add('completed');
                } else {
                    pill.classList.remove('completed');
                }
            }
        });

        // Dynamic Readiness Status Gauge
        if (readinessBadge && readinessStatusText) {
            readinessBadge.className = 'readiness-badge ';
            if (percentage === 0) {
                readinessBadge.classList.add('readiness-low');
                readinessStatusText.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> لم تبدأ التجهيزات بعد - يرجى مراجعة وتجهيز متطلبات الرحلة قبل الانطلاق.';
            } else if (percentage < 40) {
                readinessBadge.classList.add('readiness-low');
                readinessStatusText.innerHTML = '<i class="fa-solid fa-battery-quarter"></i> بداية التجهيز - استكمل فحص السيارة ومستلزمات الطفلة والأدوية.';
            } else if (percentage < 80) {
                readinessBadge.classList.add('readiness-mid');
                readinessStatusText.innerHTML = '<i class="fa-solid fa-battery-half"></i> جاهزية متوسطة - تم تجهيز معظم المتطلبات، واصل استكمال البقية.';
            } else if (percentage < 100) {
                readinessBadge.classList.add('readiness-high');
                readinessStatusText.innerHTML = '<i class="fa-solid fa-battery-three-quarters"></i> جاهزية ممتازة مرتفعة - أوشكت جميع مستلزمات الانطلاق المبارك على الإكمال!';
            } else {
                readinessBadge.classList.add('readiness-full');
                readinessStatusText.innerHTML = '<i class="fa-solid fa-circle-check"></i> 🎉 جاهزية 100%! اكتملت كافة تجهيزات الرحلة بامتياز. رافقتكم السلامة والقبول 💚';
            }
        }
    }

    checkboxes.forEach((cb, index) => {
        const savedState = localStorage.getItem(`chk_${index}`);
        if (savedState !== null) {
            cb.checked = savedState === 'true';
        }

        cb.addEventListener('change', () => {
            localStorage.setItem(`chk_${index}`, cb.checked);
            updateProgress();
        });
    });

    // Category Filtering Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-chkcat');
            
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            checklistCards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                if (cat === 'all' || cardCat === cat) {
                    card.style.display = 'flex';
                    card.style.animation = 'fadeIn 0.3s ease-in-out';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    if (btnCheckAll) {
        btnCheckAll.addEventListener('click', () => {
            checkboxes.forEach((cb, index) => {
                cb.checked = true;
                localStorage.setItem(`chk_${index}`, 'true');
            });
            updateProgress();
            showToast('تم تحديد جميع عناصر التجهيز الـ 32 بنجاح!');
        });
    }

    if (btnUncheckAll) {
        btnUncheckAll.addEventListener('click', () => {
            checkboxes.forEach((cb, index) => {
                cb.checked = false;
                localStorage.setItem(`chk_${index}`, 'false');
            });
            updateProgress();
            showToast('تم إزالة تحديد قائمة التجهيزات.');
        });
    }

    // Initial calculation on load
    updateProgress();
}



/**
 * Interactive Map & Simulation Engine
 */
let map = null;
let polyline = null;
let carMarker = null;
let simInterval = null;
let isSimulating = false;
let currentStepIndex = 0;
let simSpeed = 1;
let routeMode = 'roads'; // 'roads' or 'direct'
let roadsGeoPoints = []; // OSRM fetched real street lat/lng points
let interpolatedPoints = [];

const WAYPOINTS = [
    {
        id: 'start',
        name: 'حي وسط المبرّز التاريخي (الأحساء)',
        lat: 25.4150,
        lng: 49.5870,
        dist: 0,
        time: '05:00 ص',
        speed: '120 كم/س',
        type: 'start',
        desc: '📍 <strong>نقطة الانطلاق:</strong> حي وسط المبرّز التاريخي بالأحساء. فحص ضغط الإطارات والانطلاق فجراً 05:00 ص. <br>⚡ <strong>السرعة المسموحة:</strong> 120 كم/س'
    },
    {
        id: 'go_station',
        name: 'محطة قو ستيشن (سعّد)',
        lat: 25.1351,
        lng: 47.5337,
        dist: 210,
        time: '06:50 ص',
        speed: '120 كم/س',
        type: 'station',
        desc: '⛽ <strong>أول توقف - محطة قو ستيشن سعّد (210 كم):</strong> التزود بالوقود والقهوة وتفادي زحمة الرياض. <br>⚡ <strong>السرعة المسموحة:</strong> 120 كم/س'
    },
    {
        id: 'petroly',
        name: 'محطة بترولي الجديدة (حي العارض - الرياض)',
        lat: 24.9412,
        lng: 46.5566,
        dist: 343,
        time: '08:40 ص',
        speed: '120 كم/س',
        type: 'station',
        desc: '⛽ <strong>محطة بترولي الجديدة - حي العارض (343 كم):</strong> محطة حديثة متكاملة تقع شمال الرياض على طريق الملك فهد (حي العارض) قبل الخروج إلى طريق القصيم السريع الممتد نحو المجمعة. <br>⚡ <strong>السرعة المسموحة:</strong> 120 كم/س'
    },
    {
        id: 'aldrees_majmaah',
        name: 'محطة الدريس (المجمعة)',
        lat: 25.8500,
        lng: 45.4350,
        dist: 504,
        time: '10:30 ص',
        speed: '140 كم/س',
        type: 'station',
        desc: '⛽ <strong>محطة الدريس - المجمعة (504 كم):</strong> استراحة كبرى ونظيفة على طريق الرياض/القصيم السريع، تتيح التزود بالوقود والتموينات والراحة قبل الاستمرار لمحطة Fuel Way. <br>⚡ <strong>السرعة المسموحة:</strong> 140 كم/س (طريق القصيم السريع)'
    },

    {
        id: 'fuel_way',
        name: 'محطة فيول واي (Fuel Way) - طريق الرياض / القصيم',
        lat: 26.1834,
        lng: 43.8496,
        dist: 670,
        time: '12:30 ظ',
        speed: '140 كم/س',
        type: 'station',
        desc: '⛽ <strong>محطة فيول واي (Fuel Way) (670 كم):</strong> استراحة كبرى ونموذجية على طريق الرياض-القصيم السريع، تتيح التزود بالوقود وأداء الصلاة وتناول وجبة الغداء والراحة، وتتميز بوجود <strong>محل ديوانية شاي يقدم شاي تلقيمة بالنعناع سكر وسط ممتاز ومضبوط جدّاً ☕🍃</strong>. <br>⚡ <strong>السرعة المسموحة:</strong> 140 كم/س'
    },

    {
        id: 'powerroad',
        name: 'محطة باوررود (Powerroad) - طريق القصيم / المدينة',
        lat: 25.3273,
        lng: 41.5149,
        dist: 930,
        time: '04:45 م',
        speed: '140 كم/س',
        type: 'station',
        desc: '⛽ <strong>محطة باوررود Powerroad (930 كم):</strong> محطة حديثة ونموذجية على طريق 60 الدولي (القصيم-المدينة)، خدمات وقود ممتاز، تموينات متكاملة، كافيهات، ومصلى ودورات مياه مريحة لأداء صلاة المغرب والعشاء وتجديد الطاقة قبل الوصول للمدينة المنورة. <br>⚡ <strong>السرعة المسموحة:</strong> 140 كم/س'
    },
    {
        id: 'sayyid_shuhada',
        name: 'جامع سيّد الشهداء حمزة (المدينة المنورة)',
        lat: 24.4927,
        lng: 39.6126,
        dist: 1150,
        time: '09:30 م',
        speed: '80 - 100 كم/س',
        type: 'end',
        desc: '🕌 <strong>نقطة الوصول النهائية:</strong> جامع سيّد الشهداء حمزة بن عبد المطلب رضي الله عنه وسفح جبل أُحد بالمدينة المنورة. الحمد لله على سلامة الوصول! <br>⚡ <strong>السرعة المسموحة:</strong> 80 - 100 كم/س (داخل المدينة)'
    }
];

// Fetch Real Street Geometry via OSRM API
async function fetchRoadsGeometry() {
    if (roadsGeoPoints.length > 0) return roadsGeoPoints;

    const coordsString = WAYPOINTS.map(w => `${w.lng},${w.lat}`).join(';');
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(osrmUrl);
        if (response.ok) {
            const data = await response.json();
            if (data.routes && data.routes.length > 0) {
                const geojsonCoords = data.routes[0].geometry.coordinates;
                roadsGeoPoints = geojsonCoords.map(c => [c[1], c[0]]); // [lat, lng]
                return roadsGeoPoints;
            }
        }
    } catch (e) {
        console.warn('OSRM routing fetch failed, fallback to curve interpolation:', e);
    }

    // Fallback if offline/network fails: generate detailed intermediate points
    roadsGeoPoints = generateFallbackStreetPoints();
    return roadsGeoPoints;
}

function generateFallbackStreetPoints() {
    const fallback = [];
    const stepsPerSegment = 30;

    for (let i = 0; i < WAYPOINTS.length - 1; i++) {
        const start = WAYPOINTS[i];
        const end = WAYPOINTS[i + 1];

        for (let s = 0; s < stepsPerSegment; s++) {
            const r = s / stepsPerSegment;
            const lat = start.lat + (end.lat - start.lat) * r;
            const lng = start.lng + (end.lng - start.lng) * r;
            fallback.push([lat, lng]);
        }
    }
    const last = WAYPOINTS[WAYPOINTS.length - 1];
    fallback.push([last.lat, last.lng]);
    return fallback;
}

// Generate sub-points for simulation based on selected route mode
function generateInterpolatedPoints() {
    interpolatedPoints = [];
    const sourcePoints = (routeMode === 'roads' && roadsGeoPoints.length > 0) 
        ? roadsGeoPoints 
        : generateFallbackStreetPoints();

    const totalPts = sourcePoints.length;
    if (totalPts === 0) return;

    // Find the closest point index in sourcePoints for each waypoint in order
    const waypointIndices = [];
    let searchStartIdx = 0;
    for (let k = 0; k < WAYPOINTS.length; k++) {
        const wp = WAYPOINTS[k];
        let minD = Infinity;
        let closestIdx = searchStartIdx;
        for (let i = searchStartIdx; i < totalPts; i++) {
            const pt = sourcePoints[i];
            const d = Math.pow(pt[0] - wp.lat, 2) + Math.pow(pt[1] - wp.lng, 2);
            if (d < minD) {
                minD = d;
                closestIdx = i;
            }
        }
        waypointIndices.push(closestIdx);
        searchStartIdx = closestIdx; // Search next waypoint from here to preserve order
    }

    // Force last waypoint index to be the last point in sourcePoints
    if (waypointIndices.length > 0) {
        waypointIndices[waypointIndices.length - 1] = totalPts - 1;
    }

    for (let i = 0; i < totalPts; i++) {
        const pt = sourcePoints[i];
        const lat = pt[0];
        const lng = pt[1];

        // Find which segment i belongs to
        let k = 0;
        for (let j = 0; j < WAYPOINTS.length - 1; j++) {
            if (i >= waypointIndices[j] && i <= waypointIndices[j + 1]) {
                k = j;
                break;
            }
        }
        if (i > waypointIndices[WAYPOINTS.length - 1]) {
            k = WAYPOINTS.length - 2;
        }

        const idxA = waypointIndices[k];
        const idxB = waypointIndices[k + 1];
        
        let r = 0;
        if (idxB > idxA) {
            r = (i - idxA) / (idxB - idxA);
        }

        const distA = WAYPOINTS[k].dist;
        const distB = WAYPOINTS[k + 1].dist;
        const currentDist = Math.round(distA + r * (distB - distA));

        const nearestWp = WAYPOINTS[k];
        const nextWp = WAYPOINTS[k + 1];

        interpolatedPoints.push({
            lat: lat,
            lng: lng,
            dist: currentDist,
            startWaypoint: nearestWp,
            nextWaypoint: nextWp
        });
    }
}

async function updateRoutePolyline() {
    if (!map) return;

    let pointsToDraw = [];

    if (routeMode === 'roads') {
        pointsToDraw = await fetchRoadsGeometry();
        if (polyline) map.removeLayer(polyline);

        polyline = L.polyline(pointsToDraw, {
            color: '#10b981',
            weight: 6,
            opacity: 0.95
        }).addTo(map);
    } else {
        pointsToDraw = WAYPOINTS.map(w => [w.lat, w.lng]);
        if (polyline) map.removeLayer(polyline);

        polyline = L.polyline(pointsToDraw, {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.85,
            dashArray: '8, 8'
        }).addTo(map);
    }

    generateInterpolatedPoints();

    if (polyline) {
        map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
}

function initInteractiveMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    if (typeof L === 'undefined') {
        console.error('Leaflet library failed to load.');
        mapElement.innerHTML = '<div style="padding:40px; text-align:center; color:#f43f5e; font-family:Cairo,sans-serif;"><h3>⚠️ جاري تحميل خريطة الطريق...</h3><p>إذا لم تظهر الخريطة خلال ثوانٍ، يرجى التثبت من الاتصال بالإنترنت وتحديث الصفحة.</p></div>';
        return;
    }

    if (map) {
        setTimeout(() => map.invalidateSize(), 200);
        return;
    }

    try {
        // Center map between Al-Ahsa and Medina
        map = L.map('map', {
            scrollWheelZoom: false
        }).setView([25.4, 44.5], 6);

        // Standard OpenStreetMap Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);

        // Draw Polyline & Fetch Route
        updateRoutePolyline();

        // Custom Marker Icons
        const createMarkerIcon = (iconClass, color) => {
            return L.divIcon({
                className: 'custom-leaflet-icon',
                html: `<div style="background:${color}; color:#fff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.4); border:2px solid #ffffff;"><i class="${iconClass}"></i></div>`,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            });
        };

        // Render Waypoint Markers & Quick Buttons
        const waypointGrid = document.getElementById('waypointButtonsGrid');
        if (waypointGrid) waypointGrid.innerHTML = '';

        WAYPOINTS.forEach((wp) => {
            let iconClass = 'fa-solid fa-gas-pump';
            let color = '#3b82f6';

            if (wp.type === 'start') {
                iconClass = 'fa-solid fa-flag-checkered';
                color = '#10b981';
            } else if (wp.id === 'fuel_way') {
                iconClass = 'fa-solid fa-gas-pump';
                color = '#f59e0b';
            } else if (wp.type === 'end') {
                iconClass = 'fa-solid fa-kaaba';
                color = '#8b5cf6';
            }

            const marker = L.marker([wp.lat, wp.lng], {
                icon: createMarkerIcon(iconClass, color)
            }).addTo(map);

            marker.bindPopup(`
                <div class="custom-popup-box">
                    <h4>${wp.name}</h4>
                    <p>${wp.desc}</p>
                </div>
            `);

            if (waypointGrid) {
                const btn = document.createElement('button');
                btn.className = 'waypoint-btn';
                btn.innerHTML = `<strong>${wp.name}</strong><span>${wp.dist} كم من المبرّز</span>`;
                btn.onclick = () => {
                    map.setView([wp.lat, wp.lng], 11, { animate: true });
                    marker.openPopup();
                };
                waypointGrid.appendChild(btn);
            }
        });

        // Car Simulation Marker
        const carIcon = L.divIcon({
            className: 'car-simulation-icon',
            html: `<div style="background:#f43f5e; color:#fff; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px #f43f5e; border:3px solid #ffffff; font-size:1.2rem; transform:scale(1.1);"><i class="fa-solid fa-car-side"></i></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        carMarker = L.marker([WAYPOINTS[0].lat, WAYPOINTS[0].lng], {
            icon: carIcon,
            zIndexOffset: 1000
        }).addTo(map);

    } catch (err) {
        console.error('Error initializing Leaflet map:', err);
    }
}

/**
 * Always-Active Controls Listener Binding
 */
function initSimulationControls() {
    const startBtn = document.getElementById('simStartBtn');
    const pauseBtn = document.getElementById('simPauseBtn');
    const resetBtn = document.getElementById('simResetBtn');

    if (startBtn) startBtn.onclick = startSimulation;
    if (pauseBtn) pauseBtn.onclick = pauseSimulation;
    if (resetBtn) resetBtn.onclick = resetSimulation;

    // Speed Controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            simSpeed = parseFloat(btn.getAttribute('data-speed'));
            if (isSimulating) {
                pauseSimulation();
                startSimulation();
            }
        });
    });

    // Route Type Toggle (Roads Street Geometry vs Direct Line)
    document.querySelectorAll('.route-type-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.route-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const selectedType = btn.getAttribute('data-routetype');
            routeMode = selectedType;

            showToast(routeMode === 'roads' ? 'تم تفعيل مسار الطرق والشوراع الفعلي 🛣️' : 'تم تفعيل مسار الخط المباشر 📏');

            pauseSimulation();
            await updateRoutePolyline();
            resetSimulation();
        });
    });
}

/**
 * Driving Simulation Engine Logic
 */
function startSimulation() {
    if (!map) {
        initInteractiveMap();
    }
    if (isSimulating) return;
    if (interpolatedPoints.length === 0) generateInterpolatedPoints();

    isSimulating = true;

    const startBtn = document.getElementById('simStartBtn');
    const pauseBtn = document.getElementById('simPauseBtn');

    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;

    const intervalTime = Math.max(15, Math.round(100 / simSpeed));

    simInterval = setInterval(() => {
        if (currentStepIndex >= interpolatedPoints.length - 1) {
            pauseSimulation();
            showToast('تهانينا! اكتملت رحلة المحاكاة ووصلتم بسلامة الله إلى المدينة المنورة 🕌');
            return;
        }

        currentStepIndex++;
        const currentPt = interpolatedPoints[currentStepIndex];

        // Move Car Marker & Pan Map smoothly
        if (carMarker) {
            carMarker.setLatLng([currentPt.lat, currentPt.lng]);
        }
        if (map && currentStepIndex % 4 === 0) {
            map.panTo([currentPt.lat, currentPt.lng], { animate: true });
        }

        // Update Telemetry Metrics
        const distDone = currentPt.dist;
        const distRemain = Math.max(0, 1150 - distDone);
        const progressPct = Math.min(100, Math.round((distDone / 1150) * 100));

        const locElem = document.getElementById('teleCurrentLoc');
        const timeElem = document.getElementById('teleCurrentTime');
        const speedElem = document.getElementById('teleSpeedLimit');
        const doneElem = document.getElementById('teleDistDone');
        const remainElem = document.getElementById('teleDistRemain');
        const nextElem = document.getElementById('teleNextStop');
        const pBar = document.getElementById('simProgressBar');

        if (locElem) locElem.textContent = currentPt.startWaypoint.name;
        if (timeElem) timeElem.textContent = currentPt.startWaypoint.time || '05:00 ص';
        if (speedElem) speedElem.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${currentPt.startWaypoint.speed || '120 كم/س'}`;
        if (doneElem) doneElem.textContent = `${distDone} كم`;
        if (remainElem) remainElem.textContent = `${distRemain} كم`;
        if (nextElem) nextElem.textContent = `${currentPt.nextWaypoint.name} (${currentPt.nextWaypoint.dist} كم)`;
        if (pBar) pBar.style.width = `${progressPct}%`;

    }, intervalTime);
}

function pauseSimulation() {
    isSimulating = false;
    if (simInterval) clearInterval(simInterval);

    const startBtn = document.getElementById('simStartBtn');
    const pauseBtn = document.getElementById('simPauseBtn');

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
}

function resetSimulation() {
    pauseSimulation();
    currentStepIndex = 0;
    const startPoint = WAYPOINTS[0];

    if (carMarker) {
        carMarker.setLatLng([startPoint.lat, startPoint.lng]);
    }
    if (map) {
        map.setView([25.4, 44.5], 6);
    }

    const locElem = document.getElementById('teleCurrentLoc');
    const timeElem = document.getElementById('teleCurrentTime');
    const speedElem = document.getElementById('teleSpeedLimit');
    const doneElem = document.getElementById('teleDistDone');
    const remainElem = document.getElementById('teleDistRemain');
    const nextElem = document.getElementById('teleNextStop');
    const pBar = document.getElementById('simProgressBar');

    if (locElem) locElem.textContent = startPoint.name;
    if (timeElem) timeElem.textContent = startPoint.time || formatMinutesTo12h(timelineStartTimeMins, true);
    if (speedElem) speedElem.innerHTML = `<i class="fa-solid fa-gauge-high"></i> ${startPoint.speed || '120 كم/س'}`;
    if (doneElem) doneElem.textContent = '0 كم';
    if (remainElem) remainElem.textContent = '1,150 كم';
    if (nextElem) nextElem.textContent = `${WAYPOINTS[1].name} (${WAYPOINTS[1].dist} كم)`;
    if (pBar) pBar.style.width = '0%';
}

/**
 * Dynamic Interactive Timeline Engine & Station Rest Customization
 */
const TIMELINE_STEPS = [
    {
        id: 'start',
        name: 'الانطلاق من الأحساء (حي وسط المبرّز)',
        dist: 0,
        driveMins: 0,
        defaultRestMins: 0,
        type: 'start',
        services: 'تعبئة كاملة من المنزل',
        notes: 'صلاة الفجر، فحص ضغط الإطارات، والتأكد من برودة الثلاجة.',
        isRestSelectable: false
    },
    {
        id: 'go_station',
        name: 'محطة قو ستيشن (سعّد)',
        dist: 210,
        driveMins: 110, // ~1h 50m from Al-Ahsa (210 km at 120 km/h)
        defaultRestMins: 10,
        type: 'station',
        services: 'وقود، تموينات، دورات مياه، قهوة',
        notes: 'أول محطة وتوقف رئيسي للتزود بالوقود والقهوة وتفادي زحمة الرياض.',
        isRestSelectable: true
    },
    {
        id: 'petroly',
        name: 'محطة بترولي الجديدة (حي العارض - الرياض)',
        dist: 343,
        driveMins: 70, // 1h 10m from Go Station
        defaultRestMins: 15,
        type: 'station',
        services: 'وقود، تموينات، مطاعم ومقاهٍ، مصلى، دورات مياه',
        notes: 'توقف مريح شمال الرياض (حي العارض) على طريق الملك فهد وقبل المجمعة.',
        isRestSelectable: true
    },
    {
        id: 'aldrees_majmaah',
        name: 'محطة الدريس (المجمعة)',
        dist: 504,
        driveMins: 75, // 1h 15m from Petroly Al Arid (343 -> 504 = 161 km)
        defaultRestMins: 20,
        type: 'station',
        services: 'وقود، تموينات الدريس، كافيهات، مصلى، دورات مياه',
        notes: 'استراحة وتزود بالوقود وتفريغ طاقة الطفلة قبل مواصلة السير لمحطة Fuel Way.',
        isRestSelectable: true
    },
    {
        id: 'fuel_way',
        name: 'محطة فيول واي (Fuel Way) - طريق الرياض / القصيم',
        dist: 670,
        driveMins: 75, // ~1h 15m from Majmaah (504 -> 670 = 166 km at 140 km/h)
        defaultRestMins: 45,
        type: 'station',
        services: 'وقود ممتاز، مطاعم ومقاهٍ، ديوانية شاي تلقيمة بالنعناع، مصلى واسع، تموينات، دورات مياه',
        notes: 'استراحة الغداء وصلاة الظهر والعصر جمعاً وقصراً، وشاي تلقيمة بالنعناع سكر وسط ممتاز لتعديل المزاج وتمديد الأرجل.',
        isRestSelectable: true,
        restOptions: [
            { val: 20, text: '20 دقيقة (توقف سريع)' },
            { val: 30, text: '30 دقيقة' },
            { val: 45, text: '45 دقيقة (افتراضي)' },
            { val: 60, text: '1 ساعة (غداء وصلاة)' },
            { val: 90, text: 'ساعة ونصف' }
        ]
    },
    {
        id: 'powerroad',
        name: 'محطة باوررود (Powerroad) - طريق القصيم / المدينة',
        dist: 930,
        driveMins: 110, // ~1h 50m from Fuel Way (670 -> 930 = 260 km at 140 km/h)
        defaultRestMins: 20,
        type: 'station',
        services: 'وقود ممتاز، تموينات متكاملة، مقاهٍ وكافيهات، مصلى، دورات مياه',
        notes: 'استراحة وتزود بالوقود والقهوة وصلاة المغرب والعشاء جمعاً وقصراً.',
        isRestSelectable: true,
        restOptions: [
            { val: 10, text: '10 دقائق (سريع)' },
            { val: 15, text: '15 دقيقة' },
            { val: 20, text: '20 دقيقة (افتراضي)' },
            { val: 30, text: '30 دقيقة (صلاة وراحة)' },
            { val: 45, text: '45 دقيقة' }
        ]
    },
    {
        id: 'sayyid_shuhada',
        name: 'الوصول إلى مسجد "سيّد الشهداء حمزة"',
        dist: 1150,
        driveMins: 100, // ~1h 40m from Powerroad (930 -> 1150 = 220 km)
        defaultRestMins: 0,
        type: 'end',
        services: 'الوصول، الصلاة، والراحة',
        notes: 'الوصول بحفظ الله إلى جامع سيّد الشهداء وسفح جبل أحد بالمدينة المنورة، تفريغ الأمتعة والاسترخاء.',
        isRestSelectable: false
    }
];

function formatMinutesTo12h(totalMins, detailed = false) {
    const minsNormalized = (totalMins % 1440 + 1440) % 1440;
    const hours24 = Math.floor(minsNormalized / 60);
    const mins = Math.round(minsNormalized % 60);

    let period = hours24 >= 12 ? 'م' : 'ص';
    if (detailed) {
        if (hours24 === 0) period = 'منتصف الليل';
        else if (hours24 < 5) period = 'فجراً';
        else if (hours24 < 12) period = 'صباحاً';
        else if (hours24 === 12) period = 'ظهراً';
        else if (hours24 < 17) period = 'عصراً';
        else period = 'مساءً';
    }

    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;

    const hStr = hours12 < 10 ? '0' + hours12 : '' + hours12;
    const mStr = mins < 10 ? '0' + mins : '' + mins;

    return `${hStr}:${mStr} ${period}`;
}



let timelineStartTimeMins = 300; // 05:00 AM default
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const defaultDateStr = `${yyyy}-${mm}-${dd}`;
let timelineStartDateStr = defaultDateStr;

let stationRestDurations = {}; // { go_station: 15, petroly: 15, ... }

function getStepDateTime(departureDateStr, totalMinutesFromStartOfDay) {
    const [year, month, day] = departureDateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    date.setMinutes(date.getMinutes() + totalMinutesFromStartOfDay);
    return date;
}

function formatDateArabic(date) {
    try {
        return date.toLocaleDateString('ar-EG-u-nu-latn', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    } catch (e) {
        return date.toDateString();
    }
}

function getRelativeDateLabel(startDateStr, targetDate) {
    const [year, month, day] = startDateStr.split('-').map(Number);
    const dStart = new Date(year, month - 1, day, 0, 0, 0, 0);
    const dTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const diffTime = dTarget - dStart;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return "";
    } else if (diffDays === 1) {
        return " (اليوم التالي)";
    } else {
        return ` (بعد ${diffDays} أيام)`;
    }
}

function initTimelineSchedule() {
    const startSelect = document.getElementById('startTimeSelect');
    const dateInput = document.getElementById('startDateInput');
    const resetBtn = document.getElementById('resetScheduleBtn');

    if (!startSelect) return;

    // Load saved preferences from LocalStorage
    const savedStartTime = localStorage.getItem('roadtrip_start_mins');
    if (savedStartTime !== null) {
        timelineStartTimeMins = parseInt(savedStartTime, 10);
    }

    const savedStartDate = localStorage.getItem('roadtrip_start_date');
    if (savedStartDate !== null) {
        timelineStartDateStr = savedStartDate;
    } else {
        timelineStartDateStr = defaultDateStr;
    }

    if (dateInput) {
        dateInput.value = timelineStartDateStr;
        dateInput.addEventListener('change', (e) => {
            timelineStartDateStr = e.target.value || defaultDateStr;
            localStorage.setItem('roadtrip_start_date', timelineStartDateStr);
            recalculateTimeline();
            const dateObj = getStepDateTime(timelineStartDateStr, timelineStartTimeMins);
            showToast(`تم تعديل تاريخ انطلاق الرحلة إلى: ${formatDateArabic(dateObj)} 📅`);
        });
    }

    const savedRests = localStorage.getItem('roadtrip_rest_durations');
    if (savedRests) {
        try {
            stationRestDurations = JSON.parse(savedRests);
        } catch (e) { console.error('Error parsing rest durations:', e); }
    }

    // Populate Start Time Select for all 24 hours of the day (hourly steps)
    startSelect.innerHTML = '';
    for (let mins = 0; mins < 1440; mins += 60) {
        const opt = document.createElement('option');
        opt.value = mins;

        const hours24 = mins / 60;
        let label = '';

        if (hours24 === 0) {
            label = '12:00 AM (12:00 منتصف الليل)';
        } else if (hours24 === 12) {
            label = '12:00 PM (12:00 ظهراً)';
        } else if (hours24 < 12) {
            const hStr = hours24 < 10 ? '0' + hours24 : '' + hours24;
            const periodStr = hours24 < 5 ? 'فجراً' : 'صباحاً';
            label = `${hStr}:00 AM (${hStr}:00 ${periodStr})`;
        } else {
            const hours12 = hours24 - 12;
            const hStr = hours12 < 10 ? '0' + hours12 : '' + hours12;
            const periodStr = hours24 < 17 ? 'عصراً' : 'مساءً';
            label = `${hStr}:00 PM (${hStr}:00 ${periodStr})`;
        }

        opt.textContent = label;
        if (mins === timelineStartTimeMins) {
            opt.selected = true;
        }
        startSelect.appendChild(opt);
    }

    startSelect.addEventListener('change', (e) => {
        timelineStartTimeMins = parseInt(e.target.value, 10);
        localStorage.setItem('roadtrip_start_mins', timelineStartTimeMins);
        recalculateTimeline();
        showToast(`تم تعديل وقت انطلاق الرحلة إلى: ${formatMinutesTo12h(timelineStartTimeMins, true)} 🚗`);
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            timelineStartTimeMins = 300; // 05:00 AM
            timelineStartDateStr = defaultDateStr;
            stationRestDurations = {};
            localStorage.removeItem('roadtrip_start_mins');
            localStorage.removeItem('roadtrip_start_date');
            localStorage.removeItem('roadtrip_rest_durations');
            startSelect.value = 300;
            if (dateInput) {
                dateInput.value = defaultDateStr;
            }
            recalculateTimeline();
            showToast('تمت إعادة جميع الأوقات والاستراحات إلى الإعدادات الافتراضية 🔄');
        });
    }

    recalculateTimeline();
}

function formatDurationMins(totalMins) {
    const hours = Math.floor(totalMins / 60);
    const mins = Math.round(totalMins % 60);
    if (mins === 0) {
        return `${hours} ساعة`;
    }
    return `${hours} ساعة و ${mins} دقيقة`;
}

function recalculateTimeline() {
    const tbody = document.getElementById('timelineTableBody');
    const tfoot = document.getElementById('timelineTableFoot');
    if (!tbody) return;

    tbody.innerHTML = '';

    let currentMins = timelineStartTimeMins;
    let totalDriveMins = 0;
    let totalRestMins = 0;

    TIMELINE_STEPS.forEach((step) => {
        // Calculate Drive Duration
        totalDriveMins += step.driveMins;
        currentMins += step.driveMins;

        const arrivalMins = currentMins;

        // Get or default rest duration
        let restMins = step.defaultRestMins;
        if (step.isRestSelectable && stationRestDurations[step.id] !== undefined) {
            restMins = parseInt(stationRestDurations[step.id], 10);
        }
        totalRestMins += restMins;

        const departureMins = arrivalMins + restMins;
        currentMins = departureMins;

        const arrivalDateObj = getStepDateTime(timelineStartDateStr, arrivalMins);
        const relDateLabel = getRelativeDateLabel(timelineStartDateStr, arrivalDateObj);

        // Sync with WAYPOINTS array if matching ID
        const matchWp = WAYPOINTS.find(w => w.id === step.id);
        if (matchWp) {
            matchWp.time = formatMinutesTo12h(arrivalMins, true);
        }

        let dateSubHtml = '';
        if (relDateLabel) {
            dateSubHtml = `<span style="display:block; font-size:0.75rem; font-weight:normal; opacity:0.85; margin-top:2px;">${relDateLabel.trim()}</span>`;
        }

        // Format Time String for Row
        let timeDisplayStr = '';
        if (step.type === 'start') {
            timeDisplayStr = `<strong class="text-accent">${formatMinutesTo12h(arrivalMins, true)}</strong>${dateSubHtml}`;
        } else if (step.type === 'depart') {
            timeDisplayStr = `<strong class="text-accent">${formatMinutesTo12h(arrivalMins)}</strong>${dateSubHtml}`;
        } else if (step.type === 'end') {
            timeDisplayStr = `<strong class="text-success">${formatMinutesTo12h(arrivalMins, true)}</strong>${dateSubHtml}`;
        } else {
            timeDisplayStr = `<strong>${formatMinutesTo12h(arrivalMins)}</strong>${dateSubHtml}`;
        }

        // Format Drive Time Cell
        let driveDisplayStr = '-';
        if (step.driveMins > 0) {
            const h = (step.driveMins / 60).toFixed(1);
            driveDisplayStr = `${h} ساعة (${step.driveMins} د)`;
        }

        // Format Rest Select Cell
        let restControlHtml = '<span class="text-muted">-</span>';
        if (step.isRestSelectable) {
            let optionsHtml = '';
            const standardOptions = [
                { val: 5, text: '5 دقائق' },
                { val: 10, text: '10 دقائق' },
                { val: 15, text: '15 دقيقة' },
                { val: 20, text: '20 دقيقة' },
                { val: 25, text: '25 دقيقة' },
                { val: 30, text: '30 دقيقة' },
                { val: 45, text: '45 دقيقة' },
                { val: 60, text: '60 دقيقة (ساعة)' }
            ];

            const optsToUse = step.restOptions || standardOptions;
            optsToUse.forEach(opt => {
                const selected = (opt.val === restMins) ? 'selected' : '';
                optionsHtml += `<option value="${opt.val}" ${selected}>${opt.text}</option>`;
            });

            restControlHtml = `
                <select class="rest-duration-select" data-step-id="${step.id}">
                    ${optionsHtml}
                </select>
            `;
        }

        let displayServices = step.services;
        let displayNotes = step.notes;

        // Row CSS Classes
        let rowClass = '';
        if (step.type === 'start' || step.type === 'depart' || step.id === 'fuel_way' || step.id === 'powerroad') rowClass = 'highlight-row';
        else if (step.type === 'end') rowClass = 'highlight-row arrival-row';

        const tr = document.createElement('tr');
        if (rowClass) tr.className = rowClass;

        tr.innerHTML = `
            <td>${timeDisplayStr}</td>
            <td><strong>${step.dist} كم</strong></td>
            <td>${driveDisplayStr}</td>
            <td><strong>${step.name}</strong></td>
            <td>${restControlHtml}</td>
            <td>
                <div style="font-size: 0.85rem;">
                    <div><i class="fa-solid fa-tag text-muted"></i> ${displayServices}</div>
                    <div style="color: var(--text-muted); margin-top:2px;">${displayNotes}</div>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Bind Rest Select Change Handlers
    document.querySelectorAll('.rest-duration-select').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const stepId = e.target.getAttribute('data-step-id');
            const newMins = parseInt(e.target.value, 10);
            stationRestDurations[stepId] = newMins;
            localStorage.setItem('roadtrip_rest_durations', JSON.stringify(stationRestDurations));
            recalculateTimeline();
            showToast('تم تحديث مدة الاستراحة وإعادة حساب الجدول الزمني ⏱️');
        });
    });
    const totalTripMins = totalDriveMins + totalRestMins;
    const formattedDrive = formatDurationMins(totalDriveMins);
    const formattedRest = formatDurationMins(totalRestMins);
    const formattedTotalTrip = formatDurationMins(totalTripMins);
    const finalArrivalMins = currentMins;
    
    const finalArrivalDateObj = getStepDateTime(timelineStartDateStr, finalArrivalMins);
    const finalDateStr = formatDateArabic(finalArrivalDateObj);
    const finalArrivalStr = formatMinutesTo12h(finalArrivalMins, true);

    // Update Hero Section Metric Cards
    const heroDriveElem = document.getElementById('heroDriveTime');
    const heroTotalElem = document.getElementById('heroTotalTripTime');
    if (heroDriveElem) heroDriveElem.textContent = formattedDrive;
    if (heroTotalElem) heroTotalElem.textContent = formattedTotalTrip;

    // Sync Simulation Telemetry with Timeline Start Time
    const teleTimeElem = document.getElementById('teleCurrentTime');
    if (teleTimeElem && !isSimulating) {
        teleTimeElem.textContent = (WAYPOINTS[0] && WAYPOINTS[0].time) ? WAYPOINTS[0].time : formatMinutesTo12h(timelineStartTimeMins, true);
    }

    // Update Timeline Tab Summary Stats Card
    const statDriveElem = document.getElementById('statDriveTime');
    const statRestElem = document.getElementById('statRestTime');
    const statArrivalElem = document.getElementById('statTotalArrival');
    const statDurationElem = document.getElementById('statTotalDuration');

    if (statDriveElem) statDriveElem.innerHTML = `${formattedDrive} <i class="fa-solid fa-car-side"></i>`;
    if (statRestElem) statRestElem.innerHTML = `${formattedRest} <i class="fa-solid fa-mug-hot"></i>`;
    if (statArrivalElem) {
        statArrivalElem.innerHTML = `
            <span class="pill-val">${finalArrivalStr} <i class="fa-solid fa-flag-checkered"></i></span>
            <span class="pill-subtext">${finalDateStr}</span>
        `;
    }
    if (statDurationElem) statDurationElem.innerHTML = `${formattedTotalTrip} <i class="fa-solid fa-hourglass-half"></i>`;

    // Clear Table Footer Summary Card (Removed per user request)
    if (tfoot) {
        tfoot.innerHTML = '';
    }
}



