// GPS Geolocation and Distance calculation utilities

/**
 * Haversine formula to calculate distance between two coordinates in kilometers.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // City road factor: Roads are not straight lines, typically ~1.25 - 1.3x straight distance
  // We provide the realistic road-adjusted estimate, rounded to 1 decimal place.
  const estimatedRoadDistance = straightDistance * 1.25;

  return Math.round(estimatedRoadDistance * 10) / 10;
}

/**
 * Get current GPS coordinates with timeout and error fallback.
 */
export function getCurrentPosition(timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ success: false, error: 'Thiết bị không hỗ trợ định vị GPS' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            timestamp: position.timestamp || Date.now(),
          },
        });
      },
      (error) => {
        let errorMsg = 'Không thể lấy vị trí';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Chưa cấp quyền định vị GPS';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS tạm thời không khả dụng';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Hết thời gian tìm GPS';
        }
        resolve({ success: false, error: errorMsg });
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Format distance in a shipper-friendly way (km or m)
 */
export function formatDistance(km) {
  if (!km || km <= 0) return '0 km';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Check if a string is raw coordinates "lat,lng"
 */
export function isCoordinateString(str) {
  if (!str || typeof str !== 'string') return false;
  return /^-?\d{1,2}\.\d+,-?\d{1,3}\.\d+$/.test(str.trim().replace(/\s+/g, ''));
}

/**
 * Smart location input parser.
 * Automatically extracts coordinates from Google Maps links, Apple Maps links,
 * Zalo shared location texts, or raw coordinate formats.
 */
export function parseLocationInput(input) {
  if (!input || typeof input !== 'string') return '';
  const raw = input.trim();

  // 1. Google Maps / Apple Maps link containing coordinates:
  // e.g. ?q=21.028511,105.854201 or @21.028511,105.854201 or ?ll=21.028511,105.854201
  const linkCoordMatch = raw.match(/(?:q=|ll=|@|\/place\/)(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
  if (linkCoordMatch) {
    return `${linkCoordMatch[1]},${linkCoordMatch[2]}`;
  }

  // 2. Raw coordinates: "21.028511, 105.854201" or "21.028511 105.854201"
  const plainCoordMatch = raw.match(/(-?\d{1,2}\.\d{3,})[,\s]+(-?\d{1,3}\.\d{3,})/);
  if (plainCoordMatch) {
    return `${plainCoordMatch[1]},${plainCoordMatch[2]}`;
  }

  // 3. Clean common message prefixes (e.g. "Địa chỉ: Ngõ 105...")
  const prefixMatch = raw.match(/(?:địa chỉ|giao tại|vị trí|đến):\s*(.+)$/i);
  if (prefixMatch && prefixMatch[1]) {
    return prefixMatch[1].trim();
  }

  return raw;
}

/**
 * Generate map route link for two coordinates (used in order history)
 */
export function getMapUrl(from, to) {
  if (!to && !from) return null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (from && to) {
    if (isIOS) {
      return `http://maps.apple.com/?saddr=${from.lat},${from.lng}&daddr=${to.lat},${to.lng}&dirflg=d`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
  }
  const target = to || from;
  return `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
}

/**
 * Open Google Maps app directly for turn-by-turn driving navigation.
 * Accepts:
 *  - destination: address string, coordinate string "lat,lng", or coordinate object {lat, lng}
 * Works completely OFFLINE if the shipper has saved the offline area in Google Maps!
 */
export function openGoogleMapsNavigation(destination) {
  let query = '';
  if (typeof destination === 'string' && destination.trim()) {
    const trimmed = destination.trim();
    if (isCoordinateString(trimmed)) {
      query = trimmed.replace(/\s+/g, '');
    } else {
      query = encodeURIComponent(trimmed);
    }
  } else if (destination && destination.lat && destination.lng) {
    query = `${destination.lat},${destination.lng}`;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  if (!query) {
    // If no address provided, open Google Maps app home screen so shipper can search manually
    if (isIOS) {
      window.location.href = 'comgooglemaps://';
    } else {
      window.open('https://www.google.com/maps', '_blank');
    }
    return;
  }

  const appSchemeUrl = `comgooglemaps://?daddr=${query}&directionsmode=driving`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;

  if (isIOS) {
    // Attempt opening the native Google Maps app directly
    const start = Date.now();
    window.location.href = appSchemeUrl;

    // Graceful fallback to web after timeout if Google Maps is not installed
    setTimeout(() => {
      if (document.hidden) return;
      if (Date.now() - start < 2000) {
        window.open(webUrl, '_blank');
      }
    }, 1500);
  } else {
    // Android or Desktop
    window.open(webUrl, '_blank');
  }
}

/**
 * Open Apple Maps navigation (built into every iPhone)
 */
export function openAppleMapsNavigation(destination) {
  let query = '';
  if (typeof destination === 'string' && destination.trim()) {
    const trimmed = destination.trim();
    if (isCoordinateString(trimmed)) {
      query = trimmed.replace(/\s+/g, '');
    } else {
      query = encodeURIComponent(trimmed);
    }
  } else if (destination && destination.lat && destination.lng) {
    query = `${destination.lat},${destination.lng}`;
  }
  if (!query) return;

  const appleUrl = `http://maps.apple.com/?daddr=${query}&dirflg=d`;
  window.location.href = appleUrl;
}
