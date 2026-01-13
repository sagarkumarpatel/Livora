var longitude = coordinate[0];
var latitude = coordinate[1];

// Red marker icon
var redIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var map = L.map("map").setView([latitude, longitude], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

L.marker([latitude, longitude], { icon: redIcon })
  .addTo(map)
  .bindPopup(placeName)
  .openPopup();
