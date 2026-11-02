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
 * Generate map route link (Apple Maps on iOS / Google Maps)
 */
export function getMapUrl(from, to) {
  if (!from || !to) return null;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    return `http://maps.apple.com/?saddr=${from.lat},${from.lng}&daddr=${to.lat},${to.lng}&dirflg=d`;
  }
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`;
}
