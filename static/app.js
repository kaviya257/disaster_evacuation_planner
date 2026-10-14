
// static/app.js

// --------------------------------------------------
// 1. Map setup
// --------------------------------------------------

const map = L.map("map").setView([11.0168, 76.9558], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19
}).addTo(map);


// --------------------------------------------------
// 2. HTML elements
// --------------------------------------------------

const startModeBtn = document.getElementById("start-mode");
const fireModeBtn = document.getElementById("fire-mode");
const destinationModeBtn = document.getElementById("destination-mode");

const planBtn =
    document.getElementById("plan-btn") ||
    document.getElementById("find-routes-btn") ||
    document.getElementById("plan-routes");

const locationBtn =
    document.getElementById("locate-btn") ||
    document.getElementById("use-location");

const refreshServicesBtn =
    document.getElementById("refresh-services");

const message = document.getElementById("message");
const routesContainer =
    document.getElementById("routes-container") ||
    document.getElementById("route-results");


// --------------------------------------------------
// 3. Location-selection variables
// --------------------------------------------------

let mode = "start";

let startPoint = null;
let firePoint = null;
let destinationPoint = null;

let startMarker = null;
let fireMarker = null;
let destinationMarker = null;

let routeLayer = null;
let serviceLayer = L.layerGroup().addTo(map);


// --------------------------------------------------
// 4. Helper functions
// --------------------------------------------------

function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}

function formatLocation(point) {
    if (!point) {
        return "Not selected";
    }

    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

// Convert a clicked map location into a cell in the 6 × 6 grid.
// The backend algorithms operate on grid coordinates, not road coordinates.
function toGrid(latlng) {
    const bounds = map.getBounds();

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const rowFraction =
        (north - latlng.lat) / (north - south);

    const colFraction =
        (latlng.lng - west) / (east - west);

    const row = Math.max(
        0,
        Math.min(5, Math.floor(rowFraction * 6))
    );

    const col = Math.max(
        0,
        Math.min(5, Math.floor(colFraction * 6))
    );

    return [row, col];
}

function gridToLatLng(node) {
    const bounds = map.getBounds();

    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const east = bounds.getEast();

    const row = node[0];
    const col = node[1];

    const lat = north - ((row + 0.5) / 6) * (north - south);
    const lng = west + ((col + 0.5) / 6) * (east - west);

    return [lat, lng];
}

function updateSelectionLabels() {
    const startLabel = document.getElementById("start-label");
    const fireLabel = document.getElementById("fire-label");
    const destinationLabel =
        document.getElementById("destination-label");

    if (startLabel) {
        startLabel.textContent = formatLocation(startPoint);
    }

    if (fireLabel) {
        fireLabel.textContent = formatLocation(firePoint);
    }

    if (destinationLabel) {
        destinationLabel.textContent =
            formatLocation(destinationPoint);
    }
}


// --------------------------------------------------
// 5. Change location-selection mode
// --------------------------------------------------

function setMode(nextMode) {
    mode = nextMode;

    if (startModeBtn) {
        startModeBtn.classList.toggle(
            "active",
            mode === "start"
        );
    }

    if (fireModeBtn) {
        fireModeBtn.classList.toggle(
            "active",
            mode === "fire"
        );
    }

    if (destinationModeBtn) {
        destinationModeBtn.classList.toggle(
            "active",
            mode === "destination"
        );
    }

    const prompts = {
        start: "Click the map to select your current location.",
        fire: "Click the map to mark the fire location.",
        destination:
            "Click a potential safe destination away from the fire."
    };

    showMessage(prompts[mode]);
}

if (startModeBtn) {
    startModeBtn.addEventListener("click", () => {
        setMode("start");
    });
}

if (fireModeBtn) {
    fireModeBtn.addEventListener("click", () => {
        setMode("fire");
    });
}

if (destinationModeBtn) {
    destinationModeBtn.addEventListener("click", () => {
        setMode("destination");
    });
}


// --------------------------------------------------
// 6. Select locations by clicking on the map
// --------------------------------------------------

function selectPoint(latlng) {
    const point = {
        lat: latlng.lat,
        lng: latlng.lng,
        grid: toGrid(latlng)
    };

    if (mode === "start") {
        startPoint = point;

        if (startMarker) {
            map.removeLayer(startMarker);
        }

        startMarker = L.marker(latlng)
            .addTo(map)
            .bindPopup("Your current location")
            .openPopup();

        updateSelectionLabels();

        setMode("fire");
        return;
    }

    else if (mode === "fire") {
        firePoint = point;

        if (fireMarker) {
            map.removeLayer(fireMarker);
        }

        fireMarker = L.marker(latlng)
            .addTo(map)
            .bindPopup("Fire location")
            .openPopup();

        updateSelectionLabels();

        setMode("destination");
        return;
    }

    else if (mode === "destination") {
        destinationPoint = point;

        if (destinationMarker) {
            map.removeLayer(destinationMarker);
        }

        destinationMarker = L.marker(latlng)
            .addTo(map)
            .bindPopup("Selected destination")
            .openPopup();

        updateSelectionLabels();

        showMessage(
            "All locations selected. Find safer routes."
        );
    }
}

map.on("click", function (event) {
    selectPoint(event.latlng);
});


// --------------------------------------------------
// 7. Use the device's current location
// --------------------------------------------------

if (locationBtn) {
    locationBtn.addEventListener("click", function () {
        if (!navigator.geolocation) {
            showMessage(
                "Geolocation is not supported by this browser."
            );
            return;
        }

        showMessage("Getting your current location...");

        navigator.geolocation.getCurrentPosition(
            function (position) {
                const latlng = L.latLng(
                    position.coords.latitude,
                    position.coords.longitude
                );

                map.setView(latlng, 15);
                setMode("start");
                selectPoint(latlng);

                showMessage(
                    "Current location selected. Now mark the fire location."
                );
            },
            function (error) {
                showMessage(
                    "Could not get your location. Allow location access or select it on the map."
                );
                console.error("Geolocation error:", error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}


// --------------------------------------------------
// 8. Display route results
// --------------------------------------------------

function clearRoutes() {
    if (routeLayer) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }

    if (routesContainer) {
        routesContainer.innerHTML = "";
    }
}

function getRoutePath(route) {
    // Support common response formats from the backend.
    if (Array.isArray(route)) {
        return route;
    }

    return (
        route.path ||
        route.route ||
        route.nodes ||
        route.cells ||
        []
    );
}

function getRouteScore(route) {
    if (typeof route.score === "number") {
        return route.score;
    }

    if (typeof route.cost === "number") {
        return route.cost;
    }

    return null;
}

function renderRoutes(data) {
    clearRoutes();

    const routes = data.routes || [];

    if (routes.length === 0) {
        showMessage(
            "No candidate route was found. Try different locations."
        );
        return;
    }

    routeLayer = L.layerGroup().addTo(map);

    const recommended = data.recommended;
    const allLatLngs = [];

    routes.forEach(function (route, index) {
        const path = getRoutePath(route);

        if (!Array.isArray(path) || path.length === 0) {
            return;
        }

        const latlngs = path.map(function (node) {
            return gridToLatLng(node);
        });

        allLatLngs.push(...latlngs);

        const isBest =
            route === recommended ||
            route.recommended === true ||
            (typeof recommended === "number" &&
                recommended === index);

        const colors = [
            "#2563eb",
            "#9333ea",
            "#0d9488",
            "#ea580c",
            "#64748b"
        ];

        L.polyline(latlngs, {
            color: isBest ? "#16a34a" : colors[index % colors.length],
            weight: isBest ? 6 : 4,
            opacity: isBest ? 0.9 : 0.65,
            dashArray: isBest ? null : "7, 7"
        }).addTo(routeLayer);

        if (routesContainer) {
            const card = document.createElement("div");
            card.className = "route-card";

            if (isBest) {
                card.classList.add("best");
            }

            const title = document.createElement("h3");
            title.textContent = isBest
                ? `Route ${index + 1} — Recommended`
                : `Route ${index + 1}`;

            card.appendChild(title);

            const score = getRouteScore(route);

            const scoreText = document.createElement("p");
            scoreText.textContent =
                score !== null
                    ? `Heuristic score: ${score.toFixed(2)}`
                    : "Heuristic score: not provided";

            card.appendChild(scoreText);

            const distanceText = document.createElement("p");
            distanceText.textContent =
                `Grid steps: ${Math.max(0, path.length - 1)}`;

            card.appendChild(distanceText);

            if (typeof route.hazard === "number") {
                const hazardText = document.createElement("p");
                hazardText.textContent =
                    `Hazard penalty: ${route.hazard}`;
                card.appendChild(hazardText);
            }

            if (typeof route.crowd === "number") {
                const crowdText = document.createElement("p");
                crowdText.textContent =
                    `Crowd penalty: ${route.crowd}`;
                card.appendChild(crowdText);
            }

            routesContainer.appendChild(card);
        }
    });

    if (allLatLngs.length > 0) {
        map.fitBounds(L.latLngBounds(allLatLngs), {
            padding: [30, 30]
        });
    }

    showMessage(
        `Route planning completed. ${routes.length} candidate route(s) returned.`
    );
}


// --------------------------------------------------
// 9. Request routes from the Flask backend
// --------------------------------------------------

async function planRoutes() {
    if (!startPoint || !firePoint || !destinationPoint) {
        showMessage(
            "Select your location, the fire location, and a safe destination."
        );
        return;
    }

    if (
        startPoint.grid[0] === destinationPoint.grid[0] &&
        startPoint.grid[1] === destinationPoint.grid[1]
    ) {
        showMessage(
            "Choose a destination in a different grid cell."
        );
        return;
    }

    if (
        firePoint.grid[0] === destinationPoint.grid[0] &&
        firePoint.grid[1] === destinationPoint.grid[1]
    ) {
        showMessage(
            "Choose a destination in a different cell from the fire."
        );
        return;
    }

    if (
        startPoint.grid[0] === firePoint.grid[0] &&
        startPoint.grid[1] === firePoint.grid[1]
    ) {
        showMessage(
            "Your selected location is in the same grid cell as the fire. Select different cells if possible."
        );
        return;
    }

    if (planBtn) {
        planBtn.disabled = true;
    }

    showMessage("Calculating candidate routes...");
    clearRoutes();

    try {
        // The fire cell is sent to the backend so it can be excluded.
        const response = await fetch("/api/plan", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start: startPoint.grid,
                goal: destinationPoint.grid,
                fire: firePoint.grid
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || data.message || "Route planning failed."
            );
        }

        renderRoutes(data);
    }

    catch (error) {
        console.error("Route planning error:", error);

        showMessage(
            error.message ||
            "Could not calculate routes. Check the server terminal."
        );
    }

    finally {
        if (planBtn) {
            planBtn.disabled = false;
        }
    }
}

if (planBtn) {
    planBtn.addEventListener("click", planRoutes);
}


// --------------------------------------------------
// 10. Load nearby hospitals, police stations and shelters
// --------------------------------------------------

async function loadEmergencyServices() {
    serviceLayer.clearLayers();

    const center = map.getCenter();

    const query = `
        [out:json][timeout:20];
        (
          node["amenity"="hospital"](around:7000,${center.lat},${center.lng});
          way["amenity"="hospital"](around:7000,${center.lat},${center.lng});
          node["amenity"="police"](around:7000,${center.lat},${center.lng});
          way["amenity"="police"](around:7000,${center.lat},${center.lng});
          node["amenity"="shelter"](around:7000,${center.lat},${center.lng});
          way["amenity"="shelter"](around:7000,${center.lat},${center.lng});
          node["emergency"="shelter"](around:7000,${center.lat},${center.lng});
          way["emergency"="shelter"](around:7000,${center.lat},${center.lng});
        );
        out center;
    `;

    try {
        showServiceStatus("Loading nearby emergency services...");

        const response = await fetch(
            "https://overpass-api.de/api/interpreter",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded;charset=UTF-8"
                },
                body: "data=" + encodeURIComponent(query)
            }
        );

        if (!response.ok) {
            throw new Error("Emergency-service lookup failed.");
        }

        const data = await response.json();

        let hospitals = 0;
        let police = 0;
        let shelters = 0;

        data.elements.forEach(function (place) {
            const tags = place.tags || {};

            let lat = place.lat;
            let lng = place.lon;

            // Ways may return their approximate center instead of lat/lon.
            if (
                (lat === undefined || lng === undefined) &&
                place.center
            ) {
                lat = place.center.lat;
                lng = place.center.lon;
            }

            if (lat === undefined || lng === undefined) {
                return;
            }

            let category = "";
            let color = "";

            if (tags.amenity === "hospital") {
                category = "Hospital";
                color = "#dc2626";
                hospitals++;
            } else if (tags.amenity === "police") {
                category = "Police station";
                color = "#2563eb";
                police++;
            } else if (
                tags.amenity === "shelter" ||
                tags.emergency === "shelter"
            ) {
                category = "Shelter";
                color = "#16a34a";
                shelters++;
            } else {
                return;
            }

            const name = tags.name || category;

            L.circleMarker([lat, lng], {
                radius: 7,
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2
            })
                .bindPopup(
                    `<strong>${escapeHTML(name)}</strong><br>${escapeHTML(category)}`
                )
                .addTo(serviceLayer);
        });

        updateServiceCounts(hospitals, police, shelters);

        showServiceStatus(
            "Emergency-service markers loaded from OpenStreetMap data."
        );
    }

    catch (error) {
        console.error("Emergency services error:", error);

        showServiceStatus(
            "Could not load emergency services. Check your internet connection and try again."
        );
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

function updateServiceCounts(hospitals, police, shelters) {
    const hospitalCount =
        document.getElementById("hospital-count");
    const policeCount =
        document.getElementById("police-count");
    const shelterCount =
        document.getElementById("shelter-count");

    if (hospitalCount) {
        hospitalCount.textContent = hospitals;
    }

    if (policeCount) {
        policeCount.textContent = police;
    }

    if (shelterCount) {
        shelterCount.textContent = shelters;
    }
}

function showServiceStatus(text) {
    const serviceStatus =
        document.getElementById("service-status");

    if (serviceStatus) {
        serviceStatus.textContent = text;
    }
}

if (refreshServicesBtn) {
    refreshServicesBtn.addEventListener(
        "click",
        loadEmergencyServices
    );
}

// Refresh service markers when the map is moved.
// Debouncing prevents repeated requests during continuous panning.
let serviceRefreshTimeout = null;

map.on("moveend", function () {
    clearTimeout(serviceRefreshTimeout);

    serviceRefreshTimeout = setTimeout(function () {
        loadEmergencyServices();
    }, 500);
});


// --------------------------------------------------
// 11. Initial page setup
// --------------------------------------------------

updateSelectionLabels();
setMode("start");
loadEmergencyServices();

