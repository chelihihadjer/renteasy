import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_CENTER } from '../utils/format.js';

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export default function MapView({
  markers = [], circle, picked, center, zoom = 13, height = 420,
  onSelect, onPick, onMoveEnd, fit = true, label = 'Carte',
}) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const handlers = useRef({});

  useEffect(() => {
    handlers.current = { onSelect, onPick, onMoveEnd };
  });

  useEffect(() => {
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(
      center || DEFAULT_CENTER,
      center ? zoom : 6
    );
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e) => handlers.current.onPick?.(e.latlng.lat, e.latlng.lng));
    map.on('moveend', () => {
      const c = map.getCenter();
      handlers.current.onMoveEnd?.(c.lat, c.lng);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    const points = [];

    markers.forEach((m) => {
      const icon = L.divIcon({
        className: 'price-pin-wrap',
        html: `<span class="price-pin${m.active ? ' is-active' : ''}">${escapeHtml(m.label)}</span>`,
        iconSize: null,
      });
      const marker = L.marker([m.lat, m.lng], { icon, title: m.title, keyboard: true, riseOnHover: true });
      marker.on('click', () => handlers.current.onSelect?.(m.id));
      marker.addTo(layer);
      points.push([m.lat, m.lng]);
    });

    if (circle) {
      L.circle([circle.lat, circle.lng], {
        radius: circle.radius, color: '#1f48c7', weight: 1.5, fillColor: '#1f48c7', fillOpacity: 0.12,
      }).addTo(layer);
    }
    if (picked) {
      L.circleMarker([picked.lat, picked.lng], {
        radius: 9, color: '#172033', weight: 3, fillColor: '#f2ad2e', fillOpacity: 1,
      }).addTo(layer);
    }

    if (!fit) return;
    if (points.length > 1) map.fitBounds(points, { padding: [48, 48], maxZoom: 14 });
    else if (points.length === 1) map.setView(points[0], 14);
    else if (circle) map.setView([circle.lat, circle.lng], zoom);
  }, [markers, circle, picked, fit, zoom]);

  return <div ref={container} className="map" style={{ height }} role="region" aria-label={label} />;
}
