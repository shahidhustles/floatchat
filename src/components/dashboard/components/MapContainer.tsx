"use client";

import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import {
  MAPBOX_CONFIG,
  MAP_CONTROLS,
  getMapboxToken,
} from "@/lib/mapbox-config";
import { type FloatCollection } from "@/lib/float-utils";
import {
  formatFloatId,
  getRegionColor,
  formatTemperature,
  formatDepth,
  getStatusIcon,
  formatLastTransmission,
} from "@/lib/display-utils";

interface MapContainerProps {
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export default function MapContainer({ onMapLoad }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    mapboxgl.accessToken = getMapboxToken();

    if (mapContainer.current) {
      const isMobile = window.innerWidth < 768;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_CONFIG.mapStyle,
        center: [
          MAPBOX_CONFIG.initialViewState.longitude,
          MAPBOX_CONFIG.initialViewState.latitude,
        ],
        zoom: isMobile
          ? MAPBOX_CONFIG.initialViewState.zoom - 1
          : MAPBOX_CONFIG.initialViewState.zoom,
        bearing: MAPBOX_CONFIG.initialViewState.bearing,
        pitch: isMobile
          ? MAPBOX_CONFIG.initialViewState.pitch - 10
          : MAPBOX_CONFIG.initialViewState.pitch,
        projection: MAPBOX_CONFIG.projection,
        antialias: !isMobile,
        preserveDrawingBuffer: MAPBOX_CONFIG.preserveDrawingBuffer,
        ...MAP_CONTROLS,
        touchZoomRotate: true,
        touchPitch: !isMobile,
        dragRotate: !isMobile,
        keyboard: false,
      });

      map.current.on("style.load", async () => {
        if (map.current) {
          map.current.setFog(MAPBOX_CONFIG.fog);
          map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
          map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

          // Load SVG icons for floats
          await loadFloatIcons();
          await loadFloatData();

          if (onMapLoad) {
            onMapLoad(map.current);
          }
        }
      });

      map.current.on("error", (e) => {
        console.error("Mapbox error:", e);
      });
    }

    const loadFloatIcons = async () => {
      if (!map.current) return;

      try {
        const loadIcon = (
          iconPath: string,
          iconName: string
        ): Promise<void> => {
          return new Promise(async (resolve, reject) => {
            try {
              const response = await fetch(iconPath);
              const svgText = await response.text();
              const dataUrl = `data:image/svg+xml;base64,${btoa(svgText)}`;

              const image = new Image();
              image.onload = () => {
                map.current?.addImage(iconName, image);
                resolve();
              };
              image.onerror = reject;
              image.src = dataUrl;
            } catch (error) {
              reject(error);
            }
          });
        };

        // Load all icons in parallel
        await Promise.all([
          loadIcon("/icons/argo-float-active.svg", "float-active"),
          loadIcon("/icons/argo-float-inactive.svg", "float-inactive"),
          loadIcon("/icons/argo-float.svg", "float-general"),
        ]);

        console.log("Float icons loaded successfully");
      } catch (error) {
        console.error("Failed to load float icons:", error);
      }
    };

    const loadFloatData = async () => {
      try {
        const response = await fetch("/data/mockFloats.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const floatData: FloatCollection = await response.json();
        if (!floatData?.features?.length) {
          throw new Error("No float data available");
        }

        const isMobile = window.innerWidth < 768;

        if (map.current && floatData.features) {
          // Add source
          map.current.addSource("argo-floats", {
            type: "geojson",
            data: floatData,
          });

          // Add float markers using SVG icons
          map.current.addLayer({
            id: "argo-floats-markers",
            type: "symbol",
            source: "argo-floats",
            layout: {
              "icon-image": [
                "case",
                ["==", ["get", "status"], "active"],
                "float-active",
                ["==", ["get", "status"], "inactive"],
                "float-inactive",
                "float-general",
              ],
              "icon-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                isMobile ? 0.4 : 0.5,
                6,
                isMobile ? 0.6 : 0.7,
                10,
                isMobile ? 0.8 : 1.0,
                15,
                isMobile ? 1.0 : 1.2,
              ],
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
            },
          });

          // Add subtle glow effect for active floats
          map.current.addLayer({
            id: "argo-floats-glow",
            type: "circle",
            source: "argo-floats",
            filter: ["==", ["get", "status"], "active"],
            paint: {
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                8,
                6,
                12,
                10,
                16,
                15,
                20,
              ],
              "circle-color": "#10B981",
              "circle-opacity": 0.1,
              "circle-blur": 1,
            },
          });

          // Add readable labels
          map.current.addLayer({
            id: "argo-floats-labels",
            type: "symbol",
            source: "argo-floats",
            filter: ["==", ["get", "status"], "active"],
            layout: {
              "text-field": ["slice", ["get", "id"], -4],
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                0,
                6,
                isMobile ? 9 : 11,
                10,
                isMobile ? 11 : 13,
                15,
                isMobile ? 13 : 15,
              ],
              "text-offset": [0, isMobile ? 3 : 3.5],
              "text-anchor": "top",
              "text-optional": true,
            },
            paint: {
              "text-color": [
                "case",
                ["==", ["get", "region"], "Bay of Bengal"],
                "#1E40AF",
                ["==", ["get", "region"], "Arabian Sea"],
                "#047857",
                ["==", ["get", "region"], "Indian Ocean"],
                "#7C3AED",
                ["==", ["get", "region"], "Pacific Ocean"],
                "#D97706",
                ["==", ["get", "region"], "Southern Ocean"],
                "#0891B2",
                "#0F172A",
              ],
              "text-halo-color": "#FFFFFF",
              "text-halo-width": 3,
              "text-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                3,
                0,
                6,
                0.85,
                10,
                1,
              ],
            },
          });

          // Click handler
          map.current.on("click", "argo-floats-markers", (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0];
              const properties = feature.properties;

              if (properties) {
                const popupOptions: mapboxgl.PopupOptions = {
                  closeButton: true,
                  closeOnClick: true,
                  maxWidth: isMobile ? "280px" : "320px",
                  className: "custom-popup",
                };

                new mapboxgl.Popup(popupOptions)
                  .setLngLat(e.lngLat)
                  .setHTML(
                    `
                    <div class="bg-white border-2 border-blue-200 rounded-xl shadow-2xl ${
                      isMobile ? "p-4" : "p-6"
                    } ${isMobile ? "min-w-[260px]" : "min-w-[300px]"}">
                      <div class="border-b-2 border-gray-100 pb-3 mb-4">
                        <div class="flex items-center justify-between mb-2">
                          <h3 class="${
                            isMobile ? "text-lg" : "text-xl"
                          } font-bold text-gray-900">${formatFloatId(
                      properties.id
                    )}</h3>
                          <span class="text-lg">${getStatusIcon(
                            properties.status
                          )}</span>
                        </div>
                        <p class="text-sm font-medium text-white px-3 py-1 rounded-full inline-block mb-2" style="background-color: ${getRegionColor(
                          properties.region
                        )}">
                          ${properties.region}
                        </p>
                        <p class="text-xs text-gray-500">
                          Deployed by: ${properties.deployedBy || "INCOIS"} (${
                      properties.deploymentYear || "2023"
                    })
                        </p>
                        <p class="text-xs text-gray-400">
                          Last update: ${formatLastTransmission(
                            properties.lastTransmission
                          )}
                        </p>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-3 mb-4">
                        <div class="bg-red-50 border border-red-200 rounded-lg ${
                          isMobile ? "p-2" : "p-3"
                        } text-center">
                          <div class="${
                            isMobile ? "text-xl" : "text-2xl"
                          } font-bold text-red-700">${formatTemperature(
                      properties.temperature
                    )}</div>
                          <div class="text-xs font-medium text-red-600">Sea Temperature</div>
                        </div>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg ${
                          isMobile ? "p-2" : "p-3"
                        } text-center">
                          <div class="${
                            isMobile ? "text-xl" : "text-2xl"
                          } font-bold text-blue-700">${
                      properties.salinity
                    }</div>
                          <div class="text-xs font-medium text-blue-600">Salinity (PSU)</div>
                        </div>
                      </div>
                      
                      <div class="bg-indigo-50 border border-indigo-200 rounded-lg ${
                        isMobile ? "p-2" : "p-3"
                      } mb-4 text-center">
                        <div class="${
                          isMobile ? "text-xl" : "text-2xl"
                        } font-bold text-indigo-700">${formatDepth(
                      properties.depth
                    )}</div>
                        <div class="text-xs font-medium text-indigo-600">Current Depth</div>
                      </div>
                      
                      <div class="bg-gray-50 border border-gray-200 rounded-lg ${
                        isMobile ? "p-2" : "p-3"
                      } mb-3">
                        <div class="flex items-center justify-between">
                          <span class="text-sm font-medium text-gray-700">Status:</span>
                          <span class="px-3 py-1 rounded-full text-sm font-bold border-2 ${
                            properties.status === "active"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : properties.status === "inactive"
                              ? "bg-red-100 text-red-800 border-red-300"
                              : "bg-yellow-100 text-yellow-800 border-yellow-300"
                          }">
                            ${properties.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div class="pt-3 border-t border-gray-100 text-center">
                        <div class="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <span>🇮🇳</span>
                          <span>India ARGO Program</span>
                          <span>•</span>
                          <span>${properties.id}</span>
                        </div>
                      </div>
                    </div>
                  `
                  )
                  .addTo(map.current!);
              }
            }
          });

          // Hover effects
          map.current.on("mouseenter", "argo-floats-markers", () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = "pointer";
            }
          });

          map.current.on("mouseleave", "argo-floats-markers", () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = "";
            }
          });

          console.log(
            `Loaded ${floatData.features.length} India-deployed ARGO floats`
          );
        }
      } catch (error) {
        console.error("Failed to load float data:", error);
      }
    };

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [onMapLoad]);

  return (
    <div className="mapbox-container">
      <div
        ref={mapContainer}
        className="w-full h-full"
        style={{ width: "100%", height: "100vh" }}
      />
    </div>
  );
}
