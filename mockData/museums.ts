import { Timestamp } from "firebase/firestore";

export interface Museum {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  address: string;
  artworkCount: number;
  bingoPrompts: string[][];
  embeddingVersion: number;
  createdAt: Timestamp;
}

export const NY_MUSEUMS: Museum[] = [
  {
    id: "met_nyc",
    name: "The Metropolitan Museum of Art",
    location: { lat: 40.7794, lng: -73.9632 },
    address: "1000 5th Ave, New York, NY 10028",
    artworkCount: 1245,
    bingoPrompts: [
      ["Painting with a dog", "Sculpture that looks uncomfortable", "Self-portrait with suspicious eyes"],
      ["Landscape with mountains", "Artwork with gold leaf", "Still life with fruit"],
      ["Portrait of a king", "Seashell in painting", "Artwork with text"],
    ],
    embeddingVersion: 3,
    createdAt: Timestamp.fromDate(new Date("2025-01-15")),
  },
  {
    id: "moma_nyc",
    name: "Museum of Modern Art (MoMA)",
    location: { lat: 40.7614, lng: -73.9776 },
    address: "11 W 53rd St, New York, NY 10019",
    artworkCount: 876,
    bingoPrompts: [
      ["Abstract expressionist work", "Sculpture made of found objects", "Pop art piece"],
      ["Surrealist landscape", "Black and white photograph", "Video installation"],
      ["Minimalist grid", "Performance art documentation", "Mixed media collage"],
    ],
    embeddingVersion: 2,
    createdAt: Timestamp.fromDate(new Date("2025-02-10")),
  },
  {
    id: "guggenheim_nyc",
    name: "Solomon R. Guggenheim Museum",
    location: { lat: 40.783, lng: -73.959 },
    address: "1071 5th Ave, New York, NY 10128",
    artworkCount: 612,
    bingoPrompts: [
      ["Spiral ramp artwork", "Non-objective painting", "Large mobile sculpture"],
      ["Geometric abstraction", "Artwork with a circle", "Works on paper"],
      ["Impasto texture", "Blue dominant piece", "Artist from the 1960s"],
    ],
    embeddingVersion: 1,
    createdAt: Timestamp.fromDate(new Date("2025-03-05")),
  },
  {
    id: "whitney_nyc",
    name: "Whitney Museum of American Art",
    location: { lat: 40.7405, lng: -74.009 },
    address: "99 Gansevoort St, New York, NY 10014",
    artworkCount: 543,
    bingoPrompts: [
      ["American realist painting", "Artwork about urban life", "Neon sign art"],
      ["Photography of New York", "Large-scale installation", "Video with sound"],
      ["Self-portrait by living artist", "Artwork referencing film", "Work from the 1980s"],
    ],
    embeddingVersion: 2,
    createdAt: Timestamp.fromDate(new Date("2025-01-20")),
  },
  {
    id: "brooklyn_museum",
    name: "Brooklyn Museum",
    location: { lat: 40.671, lng: -73.963 },
    address: "200 Eastern Pkwy, Brooklyn, NY 11238",
    artworkCount: 789,
    bingoPrompts: [
      ["Egyptian artifact", "Feminist art piece", "Contemporary African art"],
      ["Decorative arts object", "Botanical illustration", "Brooklyn-themed work"],
      ["Large tapestry", "Artwork with a bicycle", "Community-engaged project"],
    ],
    embeddingVersion: 2,
    createdAt: Timestamp.fromDate(new Date("2025-02-18")),
  },
  {
    id: "amnh_nyc",
    name: "American Museum of Natural History",
    location: { lat: 40.7813, lng: -73.9733 },
    address: "200 Central Park West, New York, NY 10024",
    artworkCount: 345,
    bingoPrompts: [
      ["Dinosaur skeleton", "Meteorite specimen", "Taxidermy diorama"],
      ["Blue whale model", "Cultural artifact from Africa", "Mineral display"],
      ["Rose-colored gem", "Bird of paradise", "Artwork depicting evolution"],
    ],
    embeddingVersion: 1,
    createdAt: Timestamp.fromDate(new Date("2025-03-10")),
  },
];
