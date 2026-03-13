'use client';

import { useEffect, useRef } from 'react';

// Known LNG tanker positions (major vessels near Europe/NW passage)
const LNG_TANKERS = [
  { name: 'Arctic Lady', lat: 58.2, lng: -5.1, status: 'Underway', from: 'Hammerfest', to: 'Rotterdam' },
  { name: 'Methane Princess', lat: 51.9, lng: 4.5, status: 'In Port', from: 'Qatar', to: 'Rotterdam' },
  { name: 'Golar Winter', lat: 47.5, lng: -8.2, status: 'Underway', from: 'Sabine Pass', to: 'Zeebrugge' },
  { name: 'LNG Gemini', lat: 36.5, lng: -6.3, status: 'Underway', from: 'Algeria', to: 'Barcelona' },
  { name: 'Gaslog Sydney', lat: 53.5, lng: 8.1, status: 'In Port', from: 'Trinidad', to: 'Wilhelmshaven' },
  { name: 'Flex Constellation', lat: 44.2, lng: -18.5, status: 'Underway', from: 'US Gulf', to: 'Gate Terminal' },
  { name: 'Maran Gas Asclepius', lat: 38.0, lng: 23.7, status: 'Underway', from: 'Egypt', to: 'Revithoussa' },
  { name: 'Al Nuaman', lat: 29.5, lng: 48.1, status: 'Loading', from: 'Ras Laffan', to: 'Europe' },
];

export default function TankerWidget() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Load Leaflet dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as unknown as { L: typeof import('leaflet') }).L;
      const map = L.map(mapRef.current!, {
        center: [48, 10],
        zoom: 4,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Add tanker markers
      LNG_TANKERS.forEach(tanker => {
        const color = tanker.status === 'In Port' ? '#22c55e' :
                      tanker.status === 'Loading' ? '#f59e0b' : '#3b82f6';

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:12px;height:12px;border-radius:50%;
            background:${color};border:2px solid white;
            box-shadow:0 0 6px ${color};
          "></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });

        L.marker([tanker.lat, tanker.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <b>🚢 ${tanker.name}</b><br/>
            Status: <b>${tanker.status}</b><br/>
            ${tanker.from} → ${tanker.to}
          `);
      });

      mapInstanceRef.current = map;
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>🚢</span>
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
            LNG Tanker Positions
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/50">
          <span><span style={{color:'#3b82f6'}}>●</span> Underway</span>
          <span><span style={{color:'#22c55e'}}>●</span> In Port</span>
          <span><span style={{color:'#f59e0b'}}>●</span> Loading</span>
        </div>
      </div>
      <div ref={mapRef} style={{ height: '340px', borderRadius: '8px', overflow: 'hidden' }} />
    </div>
  );
          }
