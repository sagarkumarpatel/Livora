import { useEffect, useRef } from "react";
import L from "leaflet";

const redIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ListingMap({ coordinates, placeName }) {
  const containerRef = useRef(null);

  const hasValidCoords =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    Number.isFinite(Number(coordinates[0])) &&
    Number.isFinite(Number(coordinates[1])) &&
    !(Number(coordinates[0]) === 0 && Number(coordinates[1]) === 0);

  useEffect(() => {
    if (!containerRef.current || !hasValidCoords) return;

    const [longitude, latitude] = coordinates.map(Number);
    const map = L.map(containerRef.current).setView([latitude, longitude], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker([latitude, longitude], { icon: redIcon })
      .addTo(map)
      .bindPopup(placeName || "Listing Location")
      .openPopup();

    return () => {
      map.remove();
    };
  }, [coordinates, placeName, hasValidCoords]);

  if (!hasValidCoords) {
    return (
      <div className="border rounded p-4 bg-light text-muted">
        Map coordinates are unavailable for {placeName || "this location"}.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height: "420px", width: "100%", borderRadius: "1rem" }}
    />
  );
}
