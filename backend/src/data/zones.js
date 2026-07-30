/**
 * Full JAKIM e-Solat zone list, grouped by state.
 * Source: https://www.e-solat.gov.my/index.php/web/help#kod_negeri
 */
const zones = [
  {
    state: "Johor",
    zones: [
      { code: "JHR01", districts: "Pulau Aur dan Pulau Pemanggil" },
      { code: "JHR02", districts: "Johor Bahru, Kota Tinggi, Mersing, Kulai" },
      { code: "JHR03", districts: "Kluang, Pontian" },
      { code: "JHR04", districts: "Batu Pahat, Muar, Segamat, Gemas Johor" },
    ],
  },
  {
    state: "Kedah",
    zones: [
      { code: "KDH01", districts: "Kota Setar, Kubang Pasu, Pokok Sena" },
      { code: "KDH02", districts: "Kuala Muda, Yan, Pendang" },
      { code: "KDH03", districts: "Padang Terap, Sik" },
      { code: "KDH04", districts: "Baling" },
      { code: "KDH05", districts: "Bandar Baharu, Kulim" },
      { code: "KDH06", districts: "Langkawi" },
      { code: "KDH07", districts: "Puncak Gunung Jerai" },
    ],
  },
  {
    state: "Kelantan",
    zones: [
      { code: "KTN01", districts: "Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku" },
      { code: "KTN03", districts: "Gua Musang (Mukim Galas, Bertam), Jeli, Jajahan Kecil Lojing" },
    ],
  },
  {
    state: "Melaka",
    zones: [
      { code: "MLK01", districts: "Seluruh Negeri Melaka" },
    ],
  },
  {
    state: "Negeri Sembilan",
    zones: [
      { code: "NGS01", districts: "Tampin, Jempol" },
      { code: "NGS02", districts: "Jelebu, Kuala Pilah, Rembau" },
      { code: "NGS03", districts: "Port Dickson, Seremban" },
    ],
  },
  {
    state: "Pahang",
    zones: [
      { code: "PHG01", districts: "Pulau Tioman" },
      { code: "PHG02", districts: "Kuantan, Pekan, Muadzam Shah" },
      { code: "PHG03", districts: "Jerantut, Temerloh, Maran, Bera, Chenor, Jengka" },
      { code: "PHG04", districts: "Bentong, Lipis, Raub" },
      { code: "PHG05", districts: "Genting Sempah, Janda Baik, Bukit Tinggi" },
      { code: "PHG06", districts: "Cameron Highlands, Genting Highlands, Bukit Fraser" },
    ],
  },
  {
    state: "Perlis",
    zones: [
      { code: "PLS01", districts: "Kangar, Padang Besar, Arau" },
    ],
  },
  {
    state: "Pulau Pinang",
    zones: [
      { code: "PNG01", districts: "Seluruh Negeri Pulau Pinang" },
    ],
  },
  {
    state: "Perak",
    zones: [
      { code: "PRK01", districts: "Tapah, Slim River, Tanjung Malim" },
      { code: "PRK02", districts: "Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar" },
      { code: "PRK03", districts: "Lenggong, Pengkalan Hulu, Grik" },
      { code: "PRK04", districts: "Temengor, Belum" },
      { code: "PRK05", districts: "Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor" },
      { code: "PRK06", districts: "Selama, Taiping, Bagan Serai, Parit Buntar" },
      { code: "PRK07", districts: "Bukit Larut" },
    ],
  },
  {
    state: "Sabah",
    zones: [
      { code: "SBH01", districts: "Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan, Bandar Sandakan, Sukau" },
      { code: "SBH02", districts: "Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)" },
      { code: "SBH03", districts: "Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku, Bahagian Tawau (Timur)" },
      { code: "SBH04", districts: "Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Barat)" },
      { code: "SBH05", districts: "Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat" },
      { code: "SBH06", districts: "Gunung Kinabalu" },
      { code: "SBH07", districts: "Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan, Bahagian Pantai Barat" },
      { code: "SBH08", districts: "Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pedalaman (Atas)" },
      { code: "SBH09", districts: "Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pa Sia, Membakut, Weston, Bahagian Pedalaman (Bawah)" },
    ],
  },
  {
    state: "Sarawak",
    zones: [
      { code: "SWK01", districts: "Limbang, Lawas, Sundar, Trusan" },
      { code: "SWK02", districts: "Miri, Niah, Bekenu, Sibuti, Marudi" },
      { code: "SWK03", districts: "Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu" },
      { code: "SWK04", districts: "Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit" },
      { code: "SWK05", districts: "Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai" },
      { code: "SWK06", districts: "Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok" },
      { code: "SWK07", districts: "Serian, Simunjan, Samarahan, Sebuyau, Meludam" },
      { code: "SWK08", districts: "Kuching, Bau, Lundu, Sematan" },
      { code: "SWK09", districts: "Zon Khas (Kampung Patarikan)" },
    ],
  },
  {
    state: "Selangor",
    zones: [
      { code: "SGR01", districts: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
      { code: "SGR02", districts: "Kuala Selangor, Sabak Bernam" },
      { code: "SGR03", districts: "Klang, Kuala Langat" },
    ],
  },
  {
    state: "Terengganu",
    zones: [
      { code: "TRG01", districts: "Kuala Terengganu, Marang, Kuala Nerus" },
      { code: "TRG02", districts: "Besut, Setiu" },
      { code: "TRG03", districts: "Hulu Terengganu" },
      { code: "TRG04", districts: "Dungun, Kemaman" },
    ],
  },
  {
    state: "Wilayah Persekutuan",
    zones: [
      { code: "WLY01", districts: "Kuala Lumpur, Putrajaya" },
      { code: "WLY02", districts: "Labuan" },
    ],
  },
];

export const zoneCodes = new Set(zones.flatMap((state) => state.zones.map((z) => z.code)));

const zoneCodeToState = new Map(
  zones.flatMap((entry) => entry.zones.map((z) => [z.code, entry.state]))
);

/** Looks up which state a JAKIM zone code belongs to (e.g. "SGR01" -> "Selangor"). */
export function getStateForZoneCode(code) {
  return zoneCodeToState.get(code) ?? null;
}

export default zones;
