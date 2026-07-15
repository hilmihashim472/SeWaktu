/**
 * Approximate lat/lng per JAKIM zone, used as input to the Aladhan fallback
 * (method=17, JAKIM calculation method) when e-Solat itself is unreachable.
 */
const DEFAULT_COORDINATES = { latitude: 3.139, longitude: 101.6869 }; // Kuala Lumpur

const zoneCoordinates = {
  JHR01: { latitude: 2.4213, longitude: 104.4218 }, // Pulau Aur / Pulau Pemanggil
  JHR02: { latitude: 1.4927, longitude: 103.7414 }, // Johor Bahru
  JHR03: { latitude: 2.0296, longitude: 103.3178 }, // Kluang
  JHR04: { latitude: 1.8548, longitude: 102.9325 }, // Batu Pahat
  KDH01: { latitude: 6.1184, longitude: 100.3685 }, // Kota Setar
  KDH02: { latitude: 5.7659, longitude: 100.4232 }, // Kuala Muda
  KDH03: { latitude: 5.9833, longitude: 100.6667 }, // Padang Terap
  KDH04: { latitude: 5.6739, longitude: 100.9107 }, // Baling
  KDH05: { latitude: 5.3644, longitude: 100.5619 }, // Kulim
  KDH06: { latitude: 6.35, longitude: 99.8 }, // Langkawi
  KDH07: { latitude: 5.7897, longitude: 100.4346 }, // Gunung Jerai
  KTN01: { latitude: 6.1254, longitude: 102.2381 }, // Kota Bharu
  KTN03: { latitude: 4.8825, longitude: 101.9642 }, // Gua Musang
  MLK01: { latitude: 2.1896, longitude: 102.2501 }, // Melaka
  NGS01: { latitude: 2.4614, longitude: 102.2295 }, // Tampin
  NGS02: { latitude: 2.7297, longitude: 102.0287 }, // Kuala Pilah
  NGS03: { latitude: 2.7297, longitude: 101.9381 }, // Seremban
  PHG01: { latitude: 2.7833, longitude: 104.1667 }, // Pulau Tioman
  PHG02: { latitude: 3.8077, longitude: 103.326 }, // Kuantan
  PHG03: { latitude: 3.6469, longitude: 102.3624 }, // Temerloh
  PHG04: { latitude: 3.5225, longitude: 101.8551 }, // Raub
  PHG05: { latitude: 3.4167, longitude: 101.7833 }, // Genting Sempah
  PHG06: { latitude: 4.4711, longitude: 101.3833 }, // Cameron Highlands
  PLS01: { latitude: 6.4414, longitude: 100.1986 }, // Kangar
  PNG01: { latitude: 5.4141, longitude: 100.3288 }, // Pulau Pinang
  PRK01: { latitude: 4.1667, longitude: 101.4 }, // Tapah
  PRK02: { latitude: 4.5975, longitude: 101.0901 }, // Ipoh
  PRK03: { latitude: 5.2333, longitude: 101.05 }, // Grik
  PRK04: { latitude: 5.4667, longitude: 101.35 }, // Temengor
  PRK05: { latitude: 4.0167, longitude: 100.9833 }, // Teluk Intan
  PRK06: { latitude: 4.85, longitude: 100.7333 }, // Taiping
  PRK07: { latitude: 4.8667, longitude: 100.8 }, // Bukit Larut
  SBH01: { latitude: 5.84, longitude: 118.1179 }, // Sandakan
  SBH02: { latitude: 5.15, longitude: 117.4667 }, // Beluran
  SBH03: { latitude: 5.0267, longitude: 118.3364 }, // Lahad Datu
  SBH04: { latitude: 4.244, longitude: 117.8911 }, // Tawau
  SBH05: { latitude: 6.8833, longitude: 116.8333 }, // Kudat
  SBH06: { latitude: 6.0748, longitude: 116.5581 }, // Gunung Kinabalu
  SBH07: { latitude: 5.9804, longitude: 116.0735 }, // Kota Kinabalu
  SBH08: { latitude: 5.3378, longitude: 116.1602 }, // Keningau
  SBH09: { latitude: 5.3453, longitude: 115.7482 }, // Beaufort
  SWK01: { latitude: 4.75, longitude: 115.0 }, // Limbang
  SWK02: { latitude: 4.3999, longitude: 113.9914 }, // Miri
  SWK03: { latitude: 3.1667, longitude: 113.0333 }, // Bintulu
  SWK04: { latitude: 2.2872, longitude: 111.8305 }, // Sibu
  SWK05: { latitude: 2.1297, longitude: 111.5183 }, // Sarikei
  SWK06: { latitude: 1.2378, longitude: 111.4633 }, // Sri Aman
  SWK07: { latitude: 1.1667, longitude: 110.5833 }, // Serian
  SWK08: { latitude: 1.5533, longitude: 110.3592 }, // Kuching
  SWK09: { latitude: 1.55, longitude: 110.35 }, // Zon Khas
  SGR01: { latitude: 3.1516, longitude: 101.6942 }, // Shah Alam / Gombak
  SGR02: { latitude: 3.3389, longitude: 101.2528 }, // Kuala Selangor
  SGR03: { latitude: 3.0333, longitude: 101.45 }, // Klang
  TRG01: { latitude: 5.3302, longitude: 103.1408 }, // Kuala Terengganu
  TRG02: { latitude: 5.8296, longitude: 102.5563 }, // Besut
  TRG03: { latitude: 5.0833, longitude: 102.8667 }, // Hulu Terengganu
  TRG04: { latitude: 4.7817, longitude: 103.4238 }, // Dungun
  WLY01: { latitude: 3.139, longitude: 101.6869 }, // Kuala Lumpur
  WLY02: { latitude: 5.2831, longitude: 115.2308 }, // Labuan
};

export function getCoordinatesForZone(zoneCode) {
  return zoneCoordinates[zoneCode] || DEFAULT_COORDINATES;
}

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nearest JAKIM zone to a given coordinate, by straight-line distance to each
 * zone's approximate centroid (the same coordinates used for the Aladhan fallback). */
export function findNearestZone(latitude, longitude) {
  let nearestCode = null;
  let nearestDistanceKm = Infinity;

  for (const [code, coords] of Object.entries(zoneCoordinates)) {
    const distanceKm = haversineDistanceKm(latitude, longitude, coords.latitude, coords.longitude);
    if (distanceKm < nearestDistanceKm) {
      nearestDistanceKm = distanceKm;
      nearestCode = code;
    }
  }

  return { zone: nearestCode, distanceKm: Math.round(nearestDistanceKm * 10) / 10 };
}

export default zoneCoordinates;
