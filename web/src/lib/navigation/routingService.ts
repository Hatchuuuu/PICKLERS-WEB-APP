export interface RouteManeuver {
  instruction: string;
  type: string;
  modifier?: string;
  distance: number;
  location: [number, number]; // [lng, lat]
}

export interface RouteStep {
  distance: number;
  duration: number;
  name: string;
  maneuver: RouteManeuver;
}

export interface RoutingResult {
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
  steps: RouteStep[];
}

export async function fetchDirectionsRoute(
  origin: [number, number], // [lng, lat]
  destination: [number, number], // [lng, lat]
  mapboxToken: string
): Promise<RoutingResult | null> {
  if (!mapboxToken || mapboxToken.includes('mock_token')) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapboxToken}`;

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const steps: RouteStep[] = (route.legs?.[0]?.steps || []).map((s: any) => ({
      distance: s.distance,
      duration: s.duration,
      name: s.name || 'Road',
      maneuver: {
        instruction: s.maneuver.instruction,
        type: s.maneuver.type,
        modifier: s.maneuver.modifier,
        distance: s.distance,
        location: s.maneuver.location,
      },
    }));

    return {
      coordinates: route.geometry.coordinates as [number, number][],
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      steps,
    };
  } catch (err) {
    // Graceful fallback for network issues, ad-blockers, or invalid token
    return null;
  }
}

// Calculate distance in meters between two lat/lng points using Haversine formula
export function calculateHaversineDistance(
  coord1: [number, number], // [lat, lng]
  coord2: [number, number]  // [lat, lng]
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1 = (coord1[0] * Math.PI) / 180;
  const lat2 = (coord2[0] * Math.PI) / 180;
  const deltaLat = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const deltaLng = ((coord2[1] - coord1[1]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
