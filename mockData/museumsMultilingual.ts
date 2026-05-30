export interface MultilingualMuseum {
  id: string;
  name: Record<string, string>;
  location: { lat: number; lng: number };
  address: Record<string, string>;
  artworkCount: number;
  languageDefault: string;
}

export const NY_MUSEUMS_MULTILINGUAL: MultilingualMuseum[] = [
  {
    id: "the_cloisters",
    name: {
      en: "The Met Cloisters",
      es: "Las Claustras del Met",
      fr: "Les Cloîtres du Met",
      de: "Die Met-Cloisters",
      zh: "大都会修道院分馆",
    },
    location: { lat: 40.8649, lng: -73.9319 },
    address: {
      en: "99 Margaret Corbin Dr, New York, NY 10040",
      es: "99 Margaret Corbin Dr, Nueva York, NY 10040",
      fr: "99 Margaret Corbin Dr, New York, NY 10040",
      de: "99 Margaret Corbin Dr, New York, NY 10040",
      zh: "纽约玛格丽特·科尔宾大道99号",
    },
    artworkCount: 300,
    languageDefault: "en",
  },
  {
    id: "frick_collection",
    name: {
      en: "The Frick Collection",
      es: "La Colección Frick",
      fr: "La Collection Frick",
      de: "Die Frick-Sammlung",
      zh: "弗里克收藏馆",
    },
    location: { lat: 40.771, lng: -73.967 },
    address: {
      en: "1 E 70th St, New York, NY 10021",
      es: "1 E 70th St, Nueva York, NY 10021",
      fr: "1 E 70th St, New York, NY 10021",
      de: "1 E 70th St, New York, NY 10021",
      zh: "纽约东70街1号",
    },
    artworkCount: 150,
    languageDefault: "en",
  },
  {
    id: "jewish_museum",
    name: {
      en: "Jewish Museum",
      es: "Museo Judío",
      fr: "Musée Juif",
      de: "Jüdisches Museum",
      zh: "犹太博物馆",
    },
    location: { lat: 40.785, lng: -73.957 },
    address: {
      en: "1109 5th Ave, New York, NY 10128",
      es: "1109 5th Ave, Nueva York, NY 10128",
      fr: "1109 5th Ave, New York, NY 10128",
      de: "1109 5th Ave, New York, NY 10128",
      zh: "纽约第五大道1109号",
    },
    artworkCount: 200,
    languageDefault: "en",
  },
  {
    id: "el_museo_barrio",
    name: {
      en: "El Museo del Barrio",
      es: "El Museo del Barrio",
      fr: "El Museo del Barrio",
      de: "El Museo del Barrio",
      zh: "巴里奥博物馆",
    },
    location: { lat: 40.793, lng: -73.95 },
    address: {
      en: "1230 5th Ave, New York, NY 10029",
      es: "1230 5th Ave, Nueva York, NY 10029",
      fr: "1230 5th Ave, New York, NY 10029",
      de: "1230 5th Ave, New York, NY 10029",
      zh: "纽约第五大道1230号",
    },
    artworkCount: 180,
    languageDefault: "en",
  },
  {
    id: "new_museum",
    name: {
      en: "New Museum",
      es: "Nuevo Museo",
      fr: "Nouveau Musée",
      de: "Neues Museum",
      zh: "新美术馆",
    },
    location: { lat: 40.722, lng: -73.992 },
    address: {
      en: "235 Bowery, New York, NY 10002",
      es: "235 Bowery, Nueva York, NY 10002",
      fr: "235 Bowery, New York, NY 10002",
      de: "235 Bowery, New York, NY 10002",
      zh: "纽约包厘街235号",
    },
    artworkCount: 120,
    languageDefault: "en",
  },
  {
    id: "museum_sex",
    name: {
      en: "Museum of Sex",
      es: "Museo del Sexo",
      fr: "Musée du Sexe",
      de: "Museum für Sexualität",
      zh: "性博物馆",
    },
    location: { lat: 40.747, lng: -73.987 },
    address: {
      en: "233 5th Ave, New York, NY 10016",
      es: "233 5th Ave, Nueva York, NY 10016",
      fr: "233 5th Ave, New York, NY 10016",
      de: "233 5th Ave, New York, NY 10016",
      zh: "纽约第五大道233号",
    },
    artworkCount: 80,
    languageDefault: "en",
  },
];
