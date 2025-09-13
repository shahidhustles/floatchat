// Mapbox GL configuration for 3D Indian Ocean dashboard
export const MAPBOX_CONFIG = {
  // Map center: Indian Ocean (-10°S, 75°E)
  initialViewState: {
    latitude: -10,
    longitude: 75,
    zoom: 4,
    bearing: 0,
    pitch: 30, // 3D tilt angle
  },

  // Map style and projection
  mapStyle: "mapbox://styles/mapbox/satellite-v9", // Satellite view for ocean
  projection: "globe" as const, // 3D globe projection

  // Performance settings
  antialias: true,
  preserveDrawingBuffer: true,

  // Globe atmosphere
  fog: {
    range: [0.8, 8] as [number, number],
    color: "#ffffff",
    "horizon-blend": 0.1,
  },

  // Ocean region bounds (Indian Ocean focus)
  bounds: {
    north: 30, // Northern boundary
    south: -50, // Southern boundary
    east: 120, // Eastern boundary
    west: 30, // Western boundary
  },
};

// Map controls configuration
export const MAP_CONTROLS = {
  scrollZoom: true,
  boxZoom: true,
  dragRotate: true,
  dragPan: true,
  keyboard: true,
  doubleClickZoom: true,
  touchZoomRotate: true,
};

// Environment variables
export const getMapboxToken = () => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn(
      "Mapbox token not found. Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env.local"
    );
    return "pk.demo_token"; // Fallback for development
  }
  return token;
};
