const axios = require("axios");

/**
 * Geocodes a location + country string using OpenStreetMap Nominatim.
 * Falls back gracefully to [0, 0] if geocoding returns no results or fails.
 */
async function geocodeLocation(location, country) {
  const queries = [
    [location, country].filter(Boolean).join(", "),
    location,
  ].filter(Boolean);

  for (const q of queries) {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: { format: "json", q, limit: 1 },
          headers: {
            "User-Agent": "LivoraApp/1.0 (https://github.com/livora)",
          },
          timeout: 5000,
        }
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        const lat = Number(response.data[0].lat);
        const lon = Number(response.data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          return {
            type: "Point",
            coordinates: [lon, lat],
          };
        }
      }
    } catch (err) {
      console.warn(`Geocoding lookup failed for "${q}":`, err.message);
    }
  }

  return {
    type: "Point",
    coordinates: [0, 0],
  };
}

module.exports = { geocodeLocation };
