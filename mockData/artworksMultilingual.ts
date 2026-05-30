export interface MultilingualArtwork {
  id: string;
  museumId: string;
  title: Record<string, string>;
  artist: Record<string, string>;
  description: Record<string, string>;
  bingoTileId: string;
  imageUrl?: string;
}

export const CLOISTERS_ARTWORKS_MULTILINGUAL: MultilingualArtwork[] = [
  {
    id: "clo_001",
    museumId: "the_cloisters",
    title: {
      en: "Unicorn Tapestries",
      es: "Tapices del Unicornio",
      fr: "Tapisseries de la Licorne",
      de: "Einhorn-Tapisserien",
      zh: "独角兽挂毯",
    },
    artist: {
      en: "Netherlandish workshop",
      es: "Taller neerlandés",
      fr: "Atelier néerlandais",
      de: "Niederländische Werkstatt",
      zh: "尼德兰工坊",
    },
    description: {
      en: "Seven tapestries depicting the hunt and capture of a unicorn.",
      es: "Siete tapices que representan la caza y captura de un unicornio.",
      fr: "Sept tapisseries représentant la chasse et la capture d’une licorne.",
      de: "Sieben Wandteppiche, die die Jagd und Gefangennahme eines Einhorns zeigen.",
      zh: "七幅描绘猎捕独角兽的挂毯。",
    },
    bingoTileId: "0_0",
  },
  {
    id: "clo_002",
    museumId: "the_cloisters",
    title: {
      en: "The Belles Heures of Jean de France",
      es: "Las Bellas Horas de Juan de Francia",
      fr: "Les Belles Heures de Jean de France",
      de: "Die Schönen Stunden des Jean de France",
      zh: "让·德·法兰西的美好时光",
    },
    artist: {
      en: "Limbourg Brothers",
      es: "Hermanos Limbourg",
      fr: "Frères Limbourg",
      de: "Brüder Limbourg",
      zh: "林堡兄弟",
    },
    description: {
      en: "Illuminated manuscript with calendar pages and saints' lives.",
      es: "Manuscrito iluminado con páginas de calendario y vidas de santos.",
      fr: "Manuscrit enluminé avec pages de calendrier et vies de saints.",
      de: "Leuchtendes Manuskript mit Kalenderseiten und Heiligenleben.",
      zh: "装饰手抄本，包含日历页和圣徒生平。",
    },
    bingoTileId: "0_1",
  },
  {
    id: "clo_003",
    museumId: "the_cloisters",
    title: {
      en: "The Cross of the Cloisters",
      es: "La Cruz de las Claustras",
      fr: "La Croix des Cloîtres",
      de: "Das Kreuz der Cloisters",
      zh: "修道院十字架",
    },
    artist: {
      en: "Spanish Romanesque",
      es: "Románico español",
      fr: "Roman espagnol",
      de: "Spanische Romanik",
      zh: "西班牙罗马式",
    },
    description: {
      en: "Processional cross with enamel and gemstones.",
      es: "Cruz procesional con esmalte y piedras preciosas.",
      fr: "Croix de procession avec émail et pierres précieuses.",
      de: "Prozessionskreuz mit Emaille und Edelsteinen.",
      zh: "镶珐琅和宝石的游行十字架。",
    },
    bingoTileId: "0_2",
  },
];
