// File: services/mapsService.js
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = process.env.api_key // Replace with your API key

export const getCurrentLocation = async () => {
  try {
    // Request permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return {
        address: data.results[0].formatted_address,
        components: data.results[0].address_components,
      };
    } else {
      throw new Error('No address found for coordinates');
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return {
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      components: [],
    };
  }
};

export const createMapUrls = (latitude, longitude) => {
  return {
    googleMaps: `https://maps.google.com/?q=${latitude},${longitude}`,
    appleMaps: `http://maps.apple.com/?q=${latitude},${longitude}`,
    waze: `https://waze.com/ul?ll=${latitude},${longitude}`,
  };
};