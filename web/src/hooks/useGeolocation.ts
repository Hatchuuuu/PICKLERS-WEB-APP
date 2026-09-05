import { useState, useEffect } from 'react';

export interface GeolocationPositionState {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  error: string | null;
  isPermissionDenied: boolean;
}

export function useGeolocation(active: boolean = true) {
  const [positionState, setPositionState] = useState<GeolocationPositionState>({
    latitude: null,
    longitude: null,
    heading: null,
    speed: null,
    accuracy: null,
    error: null,
    isPermissionDenied: false,
  });

  useEffect(() => {
    if (!active || typeof window === 'undefined' || !navigator.geolocation) {
      if (!navigator.geolocation) {
        setPositionState((prev) => ({ ...prev, error: 'Geolocation is not supported by your browser.' }));
      }
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPositionState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
          error: null,
          isPermissionDenied: false,
        });
      },
      (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED;
        setPositionState((prev) => ({
          ...prev,
          error: err.message,
          isPermissionDenied: isDenied,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [active]);

  return positionState;
}
