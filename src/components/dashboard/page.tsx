"use client";

import React from "react";
import MapContainer from "./components/MapContainer";

export default function DashboardPage() {
  const handleMapLoad = (map: mapboxgl.Map) => {
    console.log("3D Indian Ocean map loaded successfully!");
    console.log("Map center:", map.getCenter());
    console.log("Map zoom:", map.getZoom());
  };

  return (
    <main className="w-full h-screen overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h1 className="text-xl font-bold text-gray-800">FloatChat Dashboard</h1>
        <p className="text-sm text-gray-600">3D Ocean Intelligence</p>
        <p className="text-xs text-blue-600 mt-1">
          Phase 1: 3D Indian Ocean Map
        </p>
      </div>

      <MapContainer onMapLoad={handleMapLoad} />
    </main>
  );
}
