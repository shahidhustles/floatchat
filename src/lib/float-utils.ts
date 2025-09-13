// Float data processing utilities
export interface FloatProperties {
  id: string;
  temperature: number;
  salinity: number;
  depth: number;
  lastTransmission: string;
  status: "active" | "inactive" | "maintenance";
  region: string;
}

export interface FloatFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: FloatProperties;
}

export interface FloatCollection {
  type: "FeatureCollection";
  features: FloatFeature[];
}

// Temperature-based color coding
export const getTemperatureColor = (temp: number): string => {
  if (temp < 15) return "#2563eb"; // Cold - Blue
  if (temp < 25) return "#16a34a"; // Moderate - Green
  if (temp < 30) return "#eab308"; // Warm - Yellow
  return "#dc2626"; // Hot - Red
};

// Status-based opacity
export const getStatusOpacity = (status: string): number => {
  switch (status) {
    case "active":
      return 0.9;
    case "inactive":
      return 0.4;
    case "maintenance":
      return 0.6;
    default:
      return 0.7;
  }
};

// Float marker size based on depth
export const getFloatSize = (depth: number): number => {
  // Deeper floats = larger markers (more significant)
  if (depth < 500) return 6;
  if (depth < 1000) return 8;
  if (depth < 1500) return 10;
  return 12;
};
