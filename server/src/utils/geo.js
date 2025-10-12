const EARTH_RADIUS_KM = 6371;

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c; // Distance in kilometers
};

// Convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Convert radians to degrees
const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

// Calculate bearing between two points
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  return bearing;
};

// Calculate midpoint between two points
const calculateMidpoint = (lat1, lon1, lat2, lon2) => {
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const dLon = toRadians(lon2 - lon1);
  
  const x = Math.cos(lat2Rad) * Math.cos(dLon);
  const y = Math.cos(lat2Rad) * Math.sin(dLon);
  
  const lat3Rad = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + x) * (Math.cos(lat1Rad) + x) + y * y)
  );
  
  const lon3Rad = toRadians(lon1) + Math.atan2(y, Math.cos(lat1Rad) + x);
  
  return {
    latitude: toDegrees(lat3Rad),
    longitude: toDegrees(lon3Rad)
  };
};

// Check if point is within circular geofence
const isPointInCircle = (pointLat, pointLon, centerLat, centerLon, radiusKm) => {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusKm;
};

// Check if point is within polygon geofence
const isPointInPolygon = (pointLat, pointLon, polygon) => {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > pointLon) !== (yj > pointLon)) &&
        (pointLat < (xj - xi) * (pointLon - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Check if point is within geofence (circle or polygon)
const isPointInGeofence = (pointLat, pointLon, geofence) => {
  if (!geofence) return true;
  
  if (geofence.type === 'circle') {
    return isPointInCircle(
      pointLat, pointLon,
      geofence.center[1], geofence.center[0], // Note: center is [lng, lat]
      geofence.radiusKm
    );
  }
  
  if (geofence.type === 'polygon') {
    return isPointInPolygon(pointLat, pointLon, geofence.coordinates);
  }
  
  return true;
};

// Calculate delivery fee based on distance
const calculateDeliveryFee = (distanceKm, baseRate = 10000, ratePerKm = 5000) => {
  return baseRate + (distanceKm * ratePerKm);
};

// Find restaurants within delivery range
const findRestaurantsInRange = (userLat, userLon, restaurants, maxDistanceKm = 10) => {
  return restaurants.filter(restaurant => {
    const distance = calculateDistance(
      userLat, userLon,
      restaurant.location.coordinates[1], // lat
      restaurant.location.coordinates[0]  // lng
    );
    return distance <= maxDistanceKm;
  });
};

// Calculate estimated delivery time
const calculateDeliveryTime = (distanceKm, droneSpeedKmh = 50, prepTimeMinutes = 15) => {
  const flightTimeMinutes = (distanceKm / droneSpeedKmh) * 60;
  return Math.round(prepTimeMinutes + flightTimeMinutes);
};

// Generate waypoints for drone flight path
const generateWaypoints = (startLat, startLon, endLat, endLon, numPoints = 5) => {
  const waypoints = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const ratio = i / numPoints;
    const lat = startLat + (endLat - startLat) * ratio;
    const lon = startLon + (endLon - startLon) * ratio;
    
    waypoints.push({
      latitude: lat,
      longitude: lon,
      altitude: 100, // Default altitude
      order: i
    });
  }
  
  return waypoints;
};

// Calculate flight path distance
const calculateFlightPathDistance = (waypoints) => {
  if (waypoints.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    totalDistance += calculateDistance(
      prev.latitude, prev.longitude,
      curr.latitude, curr.longitude
    );
  }
  
  return Math.round(totalDistance * 100) / 100; // Round to 2 decimal places
};

// Estimate battery consumption
const estimateBatteryConsumption = (distanceKm, payloadWeightGrams, droneEfficiency = 0.8) => {
  // Base consumption: 1% per km
  // Additional consumption: 0.1% per 100g payload per km
  const baseConsumption = distanceKm * 1; // percentage
  const payloadConsumption = (distanceKm * payloadWeightGrams / 100) * 0.1; // percentage
  
  return Math.min(100, Math.round((baseConsumption + payloadConsumption) / droneEfficiency));
};

// Validate coordinates
const isValidCoordinate = (lat, lon) => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

// Format coordinates for display
const formatCoordinate = (coordinate, precision = 6) => {
  return parseFloat(coordinate.toFixed(precision));
};

// Convert coordinate to MongoDB Point format
const toMongoPoint = (longitude, latitude) => {
  return {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
};

// Convert MongoDB Point to lat/lng object
const fromMongoPoint = (point) => {
  return {
    latitude: point.coordinates[1],
    longitude: point.coordinates[0]
  };
};

module.exports = {
  calculateDistance,
  toRadians,
  toDegrees,
  calculateBearing,
  calculateMidpoint,
  isPointInCircle,
  isPointInPolygon,
  isPointInGeofence,
  calculateDeliveryFee,
  findRestaurantsInRange,
  calculateDeliveryTime,
  generateWaypoints,
  calculateFlightPathDistance,
  estimateBatteryConsumption,
  isValidCoordinate,
  formatCoordinate,
  toMongoPoint,
  fromMongoPoint
};

