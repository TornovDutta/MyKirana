import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({ lat: null, lng: null, error: null, loading: true });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) setState({ lat: null, lng: null, error: 'Location permission denied', loading: false });
          return;
        }

        // Use last known position immediately so UI isn't blocked waiting for a fresh GPS fix
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          setState({ lat: last.coords.latitude, lng: last.coords.longitude, error: null, loading: false });
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setState({ lat: loc.coords.latitude, lng: loc.coords.longitude, error: null, loading: false });
        }
      } catch {
        if (!cancelled) {
          setState({ lat: null, lng: null, error: 'Location unavailable. Please enable location services.', loading: false });
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}
