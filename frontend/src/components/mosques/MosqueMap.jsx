import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

const MALAYSIA_CENTER = [4.2105, 101.9758];
const MALAYSIA_ZOOM = 6;

// Free CARTO basemaps (no API key) that pair with the app's light/dark theme,
// instead of a single fixed-look OSM raster tile. Attribution string is
// CARTO's required wording alongside the underlying OSM credit.
const TILE_URLS = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function markerIconHtml(color) {
  return `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.5);"></span>`;
}

function clusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count >= 100 ? 44 : count >= 20 ? 38 : 32;
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:rgba(196,147,63,0.85);border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.5);color:#fff;font-weight:600;font-family:inherit;font-size:${count >= 100 ? 13 : 12}px;">${count}</div>`,
    className: "mosque-cluster-icon",
    iconSize: [size, size],
  });
}

function buildPopupContent(mosque, { fallbackName, viewDetailsLabel, onSelect }) {
  const container = document.createElement("div");
  container.className = "min-w-[11rem] max-w-[16rem]";

  const title = document.createElement("p");
  title.className = "font-serif text-sm text-ink-100";
  title.textContent = mosque.name || fallbackName;
  container.appendChild(title);

  if (mosque.address) {
    const address = document.createElement("p");
    address.className = "mt-1 text-xs text-ink-400";
    address.textContent = mosque.address;
    container.appendChild(address);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "mt-2 w-full rounded-md border border-brass/60 bg-brass/10 px-2 py-1.5 text-xs font-medium text-accent-strong transition-colors hover:bg-brass/20";
  button.textContent = viewDetailsLabel;
  button.addEventListener("click", () => onSelect(mosque.id));
  container.appendChild(button);

  return container;
}

/** Thin imperative wrapper around vanilla Leaflet + leaflet.markercluster
 * (not react-leaflet — avoids any React 19 peer-dependency uncertainty, and
 * this map's needs are simple enough not to need a declarative wrapper). */
export default function MosqueMap({ mosques, userLocation, onSelect, className }) {
  const { t } = useLanguage();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const hasAutoFitRef = useRef(false);

  // Mount once: create the map, tile layer, and cluster group.
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: MALAYSIA_CENTER,
      zoom: MALAYSIA_ZOOM,
      zoomControl: true,
    });
    mapRef.current = map;

    tileLayerRef.current = L.tileLayer(TILE_URLS[resolvedTheme] ?? TILE_URLS.light, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    clusterGroupRef.current = L.markerClusterGroup({ iconCreateFunction: clusterIcon });
    map.addLayer(clusterGroupRef.current);

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      clusterGroupRef.current = null;
      userMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time setup
  }, []);

  // Swap the basemap when the app theme changes.
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(TILE_URLS[resolvedTheme] ?? TILE_URLS.light);
  }, [resolvedTheme]);

  // Repopulate markers whenever the result set changes.
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();

    const icon = L.divIcon({
      html: markerIconHtml("var(--accent)"),
      className: "mosque-marker-icon",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -10],
    });

    const markers = mosques
      .filter((m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude))
      .map((mosque) => {
        const marker = L.marker([mosque.latitude, mosque.longitude], { icon });
        marker.bindPopup(
          () =>
            buildPopupContent(mosque, {
              fallbackName: t("mosques.unnamed"),
              viewDetailsLabel: t("mosques.viewDetails"),
              onSelect,
            }),
          { className: "mosque-popup" }
        );
        return marker;
      });

    clusterGroup.addLayers(markers);

    // Only auto-fit once, the first time markers arrive — afterwards the
    // user's own pan/zoom takes priority (e.g. narrowing by state shouldn't
    // yank the view every time).
    if (markers.length && !hasAutoFitRef.current) {
      hasAutoFitRef.current = true;
      mapRef.current?.fitBounds(L.featureGroup(markers).getBounds().pad(0.2));
    }
  }, [mosques, onSelect, t]);

  // Show/update a distinct marker for "use my location", and fly to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const icon = L.divIcon({
        html: markerIconHtml("var(--positive)"),
        className: "mosque-user-marker-icon",
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
      map.flyTo([userLocation.latitude, userLocation.longitude], 14, { duration: 1 });
    }
  }, [userLocation]);

  return <div ref={containerRef} className={className} />;
}
