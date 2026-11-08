// frontend/src/components/ColdStorageMap.tsx
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ColdStorageFacility } from '../types';

interface ColdStorageMapProps {
  facilities: ColdStorageFacility[];
  selectedFacility: ColdStorageFacility | null;
  onSelectFacility: (facility: ColdStorageFacility) => void;
  onBookFacility: (facility: ColdStorageFacility) => void;
}

export const ColdStorageMap: React.FC<ColdStorageMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  onBookFacility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center around Pune / Nashik agricultural corridor
    const initialLat = selectedFacility?.latitude || 18.5204;
    const initialLng = selectedFacility?.longitude || 73.8567;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
    });

    // Add high quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Zoom controls on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;

    // Invalidate map size after short delay to handle tabs/resizing
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when facilities or selectedFacility changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    facilities.forEach((facility) => {
      const lat = facility.latitude || 18.5204;
      const lng = facility.longitude || 73.8567;
      const isSelected = selectedFacility?.id === facility.id;
      const isAvailable = facility.availability_status === 'AVAILABLE';

      const pinColor = isSelected ? '#16a34a' : (isAvailable ? '#ef4444' : '#64748b');

      const markerHtml = `
        <div style="
          position: relative;
          width: ${isSelected ? 38 : 32}px;
          height: ${isSelected ? 48 : 42}px;
          cursor: pointer;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.35));
          transform: translate(-50%, -100%);
          transition: transform 0.2s ease;
        ">
          <svg viewBox="0 0 32 42" width="${isSelected ? 38 : 32}" height="${isSelected ? 48 : 42}" fill="none">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26c0-8.84-7.16-16-16-16z" fill="${pinColor}" stroke="#ffffff" stroke-width="2"/>
            <path d="M10 19v-6l6-3.5 6 3.5v6H10z" fill="#ffffff" />
            <path d="M13.5 19v-3.5h5v3.5" fill="${pinColor}" />
          </svg>
          ${
            isSelected
              ? `<span style="
                  position: absolute;
                  top: -2px;
                  right: -2px;
                  width: 12px;
                  height: 12px;
                  border-radius: 50%;
                  background: #22c55e;
                  border: 2px solid white;
                  box-shadow: 0 0 6px #22c55e;
                "></span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'cold-storage-marker-icon',
        html: markerHtml,
        iconSize: [isSelected ? 38 : 32, isSelected ? 48 : 42],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 48 : 42],
        popupAnchor: [0, isSelected ? -48 : -42],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Create interactive popup with booking trigger
      const popupContainer = document.createElement('div');
      popupContainer.style.fontFamily = 'Inter, sans-serif';
      popupContainer.style.padding = '4px';

      popupContainer.innerHTML = `
        <div style="font-family: inherit; font-size: 12px; color: #1e293b; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <strong style="font-size: 14px; font-weight: 800; color: #0f172a;">${facility.facility_name}</strong>
            <span style="
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 9999px;
              background: ${isAvailable ? '#dcfce7' : '#fee2e2'};
              color: ${isAvailable ? '#15803d' : '#b91c1c'};
            ">${facility.availability_status}</span>
          </div>

          <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
            📍 ${facility.location_taluka}, ${facility.location_district} ${facility.distance_km ? `(${facility.distance_km} km away)` : ''}
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 8px; margin-bottom: 10px; border: 1px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">Available Space:</span>
              <strong style="color: #0f172a;">${(facility.available_capacity_kg / 1000).toLocaleString()} MT</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748b;">Monthly Rate:</span>
              <strong style="color: #16a34a;">₹${facility.storage_rate_per_kg_per_month} / kg</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Temperature:</span>
              <strong style="color: #0284c7;">${facility.temperature_range_celsius}</strong>
            </div>
          </div>

          <button id="popup-book-btn-${facility.id}" style="
            width: 100%;
            padding: 8px 12px;
            background: #16a34a;
            color: white;
            font-weight: 700;
            font-size: 11px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
          ">
            Book Cold Bay Now →
          </button>
        </div>
      `;

      marker.bindPopup(popupContainer);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-book-btn-${facility.id}`);
        if (btn) {
          btn.onclick = () => onBookFacility(facility);
        }
      });

      marker.on('click', () => {
        onSelectFacility(facility);
      });

      markersRef.current[facility.id] = marker;
    });
  }, [facilities, selectedFacility, onSelectFacility, onBookFacility]);

  // Pan to selected facility when selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility) return;

    const lat = selectedFacility.latitude || 18.5204;
    const lng = selectedFacility.longitude || 73.8567;

    map.flyTo([lat, lng], 13, {
      duration: 1.2,
    });

    const marker = markersRef.current[selectedFacility.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedFacility]);

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[520px]" />

      {/* Floating Map Re-center Action Badge */}
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current && selectedFacility) {
              const lat = selectedFacility.latitude || 18.5204;
              const lng = selectedFacility.longitude || 73.8567;
              mapInstanceRef.current.flyTo([lat, lng], 13);
            } else if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([18.5204, 73.8567], 11);
            }
          }}
          className="px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-md hover:bg-white active:scale-95 transition"
        >
          📍 Re-center Map
        </button>
        <span className="px-2.5 py-1.5 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono rounded-xl">
          {facilities.length} Units Synced
        </span>
      </div>
    </div>
  );
};

