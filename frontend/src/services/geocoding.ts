// frontend/src/services/geocoding.ts
/**
 * Intelligent Geospatial & Geocoding Service for Agri2Value Farms & Land 2.0
 * Provides place search, reverse geocoding, geodesic polygon area calculation,
 * and offline-resilient agricultural location resolution.
 */

export interface GeocodingResult {
  display_name: string;
  name: string;
  lat: number;
  lon: number;
  village?: string;
  district?: string;
  state?: string;
}

export interface PolygonMetrics {
  areaSqMeters: number;
  areaAcres: number;
  areaHectares: number;
  areaGuntha: number;
  perimeterMeters: number;
}

// Comprehensive offline agricultural locations dictionary for Maharashtra & India
const AGRI_LOCATIONS_DATABASE: GeocodingResult[] = [
  { display_name: "Niphad, Nashik District, Maharashtra, 422303, India", name: "Niphad", lat: 20.0768, lon: 74.0375, village: "Niphad", district: "Nashik", state: "Maharashtra" },
  { display_name: "Pimpalgaon Baswant, Niphad, Nashik, Maharashtra, 422209, India", name: "Pimpalgaon Baswant", lat: 20.1654, lon: 73.9880, village: "Pimpalgaon Baswant", district: "Nashik", state: "Maharashtra" },
  { display_name: "Lasalgaon (Asia's Largest Onion Market), Nashik, Maharashtra, 422306, India", name: "Lasalgaon", lat: 20.1478, lon: 74.2285, village: "Lasalgaon", district: "Nashik", state: "Maharashtra" },
  { display_name: "Dindori Agri-Hub, Nashik, Maharashtra, 422202, India", name: "Dindori", lat: 20.1985, lon: 73.8340, village: "Dindori", district: "Nashik", state: "Maharashtra" },
  { display_name: "Sinnar Agro Industrial Zone, Nashik, Maharashtra, 422103, India", name: "Sinnar", lat: 19.8456, lon: 73.9984, village: "Sinnar", district: "Nashik", state: "Maharashtra" },
  { display_name: "Yeola Silk & Grain Belt, Nashik, Maharashtra, 423401, India", name: "Yeola", lat: 20.0422, lon: 74.4891, village: "Yeola", district: "Nashik", state: "Maharashtra" },
  { display_name: "Narayangaon Tomato APMC, Junnar, Pune, Maharashtra, 410504, India", name: "Narayangaon", lat: 19.1235, lon: 73.9782, village: "Narayangaon", district: "Pune", state: "Maharashtra" },
  { display_name: "Junnar Horticulture Valley, Pune, Maharashtra, 410502, India", name: "Junnar", lat: 19.2081, lon: 73.8744, village: "Junnar", district: "Pune", state: "Maharashtra" },
  { display_name: "Baramati Agri Mega Hub, Pune, Maharashtra, 413102, India", name: "Baramati", lat: 18.1517, lon: 74.5770, village: "Baramati", district: "Pune", state: "Maharashtra" },
  { display_name: "Indapur Sugar & Pomegranate Basin, Pune, Maharashtra, 413106, India", name: "Indapur", lat: 18.1158, lon: 75.0272, village: "Indapur", district: "Pune", state: "Maharashtra" },
  { display_name: "Rahata Green Belt, Ahmednagar, Maharashtra, 423107, India", name: "Rahata", lat: 19.6890, lon: 74.4920, village: "Rahata", district: "Ahmednagar", state: "Maharashtra" },
  { display_name: "Sangamner Tomato Cluster, Ahmednagar, Maharashtra, 422605, India", name: "Sangamner", lat: 19.5772, lon: 74.2096, village: "Sangamner", district: "Ahmednagar", state: "Maharashtra" },
  { display_name: "Khed Rajgurunagar Potato Hub, Pune, Maharashtra, 410505, India", name: "Khed", lat: 18.8540, lon: 73.9056, village: "Khed", district: "Pune", state: "Maharashtra" },
  { display_name: "Shirur Agro Zone, Pune, Maharashtra, 412210, India", name: "Shirur", lat: 18.8285, lon: 74.3768, village: "Shirur", district: "Pune", state: "Maharashtra" },
  { display_name: "Manchar Agricultural Market, Pune, Maharashtra, 410503, India", name: "Manchar", lat: 19.0065, lon: 73.9421, village: "Manchar", district: "Pune", state: "Maharashtra" },
];

/**
 * Searches OSM Nominatim with instant offline fallback
 */
export async function searchPlace(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // Try live Nominatim API with 2.5s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(cleanQuery)}&countrycodes=in&limit=6`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any) => {
          const addr = item.address || {};
          const village = addr.village || addr.town || addr.suburb || addr.hamlet || addr.county || item.name || '';
          const district = addr.state_district || addr.county || addr.city || 'Nashik';
          const state = addr.state || 'Maharashtra';
          return {
            display_name: item.display_name,
            name: item.name || item.display_name.split(',')[0],
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            village,
            district,
            state,
          };
        });
      }
    }
  } catch {
    // Network offline or timeout - fallback to local database
  }

  // Local fallback fuzzy search
  const qLower = cleanQuery.toLowerCase();
  const matches = AGRI_LOCATIONS_DATABASE.filter(loc => 
    loc.name.toLowerCase().includes(qLower) ||
    loc.display_name.toLowerCase().includes(qLower) ||
    (loc.village && loc.village.toLowerCase().includes(qLower)) ||
    (loc.district && loc.district.toLowerCase().includes(qLower))
  );

  if (matches.length > 0) return matches;

  // Generic fallback if no specific match
  return [
    {
      display_name: `${cleanQuery}, Nashik, Maharashtra, India`,
      name: cleanQuery,
      lat: 20.0768,
      lon: 74.0375,
      village: cleanQuery,
      district: 'Nashik',
      state: 'Maharashtra',
    }
  ];
}

/**
 * Reverse geocodes coordinates to administrative boundaries
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ display_name: string; village: string; district: string; state: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const village = addr.village || addr.town || addr.suburb || addr.hamlet || 'Niphad';
      const district = addr.state_district || addr.county || addr.city || 'Nashik';
      const state = addr.state || 'Maharashtra';
      return {
        display_name: data.display_name || `${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E`,
        village,
        district,
        state,
      };
    }
  } catch {
    // Fallback
  }

  // Find nearest known agricultural center
  let nearest = AGRI_LOCATIONS_DATABASE[0];
  let minDistance = Infinity;
  for (const loc of AGRI_LOCATIONS_DATABASE) {
    const d = Math.hypot(loc.lat - lat, loc.lon - lon);
    if (d < minDistance) {
      minDistance = d;
      nearest = loc;
    }
  }

  return {
    display_name: `Location near ${nearest.name} (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`,
    village: nearest.village || nearest.name,
    district: nearest.district || 'Nashik',
    state: nearest.state || 'Maharashtra',
  };
}

/**
 * Calculates geodesic planar area & perimeter from [longitude, latitude] polygon coordinates.
 * Shoelace planar projection with WGS84 geodesic local scale.
 */
export function calculatePolygonMetrics(coords: Array<[number, number]>): PolygonMetrics {
  if (!coords || coords.length < 3) {
    return { areaSqMeters: 0, areaAcres: 0, areaHectares: 0, areaGuntha: 0, perimeterMeters: 0 };
  }

  // Remove duplicate closing point if present for shoelace calculation
  const ring = [...coords];
  if (
    ring.length > 3 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  ) {
    ring.pop();
  }

  const n = ring.length;
  if (n < 3) {
    return { areaSqMeters: 0, areaAcres: 0, areaHectares: 0, areaGuntha: 0, perimeterMeters: 0 };
  }

  // Compute centroid latitude in radians
  let avgLat = 0;
  for (let i = 0; i < n; i++) {
    avgLat += ring[i][1];
  }
  avgLat = (avgLat / n) * (Math.PI / 180);

  // WGS-84 meters per degree
  const metersPerDegLat = 111132.954 - 559.822 * Math.cos(2 * avgLat) + 1.175 * Math.cos(4 * avgLat);
  const metersPerDegLon = (Math.PI / 180) * 6378137.0 * Math.cos(avgLat);

  // Convert (lon, lat) to planar (x, y) meters relative to origin
  const originLon = ring[0][0];
  const originLat = ring[0][1];

  const points: Array<[number, number]> = ring.map(([lon, lat]) => [
    (lon - originLon) * metersPerDegLon,
    (lat - originLat) * metersPerDegLat,
  ]);

  // Shoelace formula for area
  let area = 0;
  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];

    const dx = points[j][0] - points[i][0];
    const dy = points[j][1] - points[i][1];
    perimeter += Math.hypot(dx, dy);
  }
  const areaSqMeters = Math.abs(area) / 2;

  // Conversions:
  // 1 acre = 4046.8564224 sq meters
  // 1 hectare = 10,000 sq meters
  // 1 guntha = 101.17141 sq meters (1/40th acre)
  const areaAcres = areaSqMeters / 4046.8564224;
  const areaHectares = areaSqMeters / 10000;
  const areaGuntha = areaSqMeters / 101.17141;

  return {
    areaSqMeters: Math.round(areaSqMeters * 100) / 100,
    areaAcres: Math.round(areaAcres * 100) / 100,
    areaHectares: Math.round(areaHectares * 100) / 100,
    areaGuntha: Math.round(areaGuntha * 10) / 10,
    perimeterMeters: Math.round(perimeter * 10) / 10,
  };
}

/**
 * Generates an initial rectangular boundary for a given center coordinate and area in acres.
 */
export function generateInitialBoundary(
  lat: number,
  lon: number,
  areaAcres: number = 3.5
): Array<[number, number]> {
  const sqMeters = areaAcres * 4046.8564;
  const sideMeters = Math.sqrt(sqMeters);
  const halfSideMeters = sideMeters / 2;

  const latRad = lat * (Math.PI / 180);
  const metersPerDegLat = 111132.0;
  const metersPerDegLon = 111320.0 * Math.cos(latRad);

  const dLat = halfSideMeters / metersPerDegLat;
  const dLon = halfSideMeters / metersPerDegLon;

  // 5 vertices (closed polygon): NW, NE, SE, SW, NW
  return [
    [Number((lon - dLon).toFixed(6)), Number((lat - dLat).toFixed(6))],
    [Number((lon + dLon).toFixed(6)), Number((lat - dLat).toFixed(6))],
    [Number((lon + dLon).toFixed(6)), Number((lat + dLat).toFixed(6))],
    [Number((lon - dLon).toFixed(6)), Number((lat + dLat).toFixed(6))],
    [Number((lon - dLon).toFixed(6)), Number((lat - dLat).toFixed(6))],
  ];
}
