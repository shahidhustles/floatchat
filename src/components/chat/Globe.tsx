"use client";

import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let phi = 0;

    if (canvasRef.current) {
      globeRef.current = createGlobe(canvasRef.current, {
        devicePixelRatio: 2,
        width: 1000,
        height: 1000,
        phi: 0,
        theta: 0.3,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 100,
        baseColor: [0.1, 0.2, 0.4],
        markerColor: [1, 1, 1],
        glowColor: [0.1, 0.4, 0.8],
        markers: [
          // Major oceans and seas around the world
          { location: [0.0, -30.0], size: 0.03 }, // South Atlantic Ocean
          { location: [30.0, -40.0], size: 0.03 }, // North Atlantic Ocean
          { location: [-20.0, 120.0], size: 0.03 }, // Indian Ocean
          { location: [0.0, 160.0], size: 0.03 }, // Pacific Ocean (central)
          { location: [40.0, 150.0], size: 0.03 }, // North Pacific Ocean
          { location: [-30.0, -100.0], size: 0.03 }, // South Pacific Ocean
          { location: [60.0, -10.0], size: 0.03 }, // Norwegian Sea
          { location: [35.0, 20.0], size: 0.03 }, // Mediterranean Sea
          { location: [60.0, 170.0], size: 0.03 }, // Bering Sea
          { location: [10.0, -80.0], size: 0.03 }, // Caribbean Sea
          { location: [-60.0, 0.0], size: 0.03 }, // Southern Ocean
          { location: [70.0, 40.0], size: 0.03 }, // Arctic Ocean
          { location: [20.0, 77.0], size: 0.03 }, // Bay of Bengal
          { location: [15.0, 68.0], size: 0.03 }, // Arabian Sea
          { location: [8.0, 73.0], size: 0.03 }, // Laccadive Sea
          { location: [13.0, 80.0], size: 0.03 }, // Coromandel Coast
          { location: [10.0, 75.0], size: 0.03 }, // Kerala Coast
          { location: [35.0, 140.0], size: 0.03 }, // Sea of Japan
          { location: [60.0, 150.0], size: 0.03 }, // Sea of Okhotsk
          { location: [-20.0, -140.0], size: 0.03 }, // South Pacific (Polynesia)
          { location: [-35.0, 18.0], size: 0.03 }, // South Atlantic (Cape of Good Hope)
          { location: [55.0, -160.0], size: 0.03 }, // Gulf of Alaska
          { location: [25.0, -90.0], size: 0.03 }, // Gulf of Mexico
          { location: [60.0, -45.0], size: 0.03 }, // Greenland Sea
          { location: [40.0, -20.0], size: 0.03 }, // North Atlantic (Azores)
          { location: [-40.0, 80.0], size: 0.03 }, // Southern Indian Ocean
        ],
        onRender: (state) => {
          // Auto-rotate the globe
          phi += 0.003;
          state.phi = phi;
        },
      });
    }

    return () => {
      if (globeRef.current) {
        globeRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-start justify-center">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-60 drop-shadow-2xl"
        style={{
          filter: "blur(1.5px)",
        }}
      />
    </div>
  );
}
