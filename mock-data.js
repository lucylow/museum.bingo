const MOCK_DATA = {
  museums: [
    {
      id: "met_nyc",
      name: "The Metropolitan Museum of Art",
      location: { lat: 40.7794, lng: -73.9632 },
      address: "1000 5th Ave, New York, NY 10028",
      artworkCount: 1245,
      bingoPrompts: [
        ["Painting with a dog", "Sculpture that looks uncomfortable", "Self-portrait with suspicious eyes"],
        ["Landscape with mountains", "Artwork with gold leaf", "Still life with fruit"],
        ["Portrait of a king", "Seashell in painting", "Artwork with text"]
      ],
      embeddingVersion: 3,
      createdAt: "2025-01-15T10:00:00Z"
    },
    {
      id: "louvre_paris",
      name: "Louvre Museum",
      location: { lat: 48.8606, lng: 2.3376 },
      address: "Rue de Rivoli, 75001 Paris, France",
      artworkCount: 845,
      bingoPrompts: [
        ["Egyptian artifact", "Winged figure", "Painting with a smile"],
        ["Crown jewels", "Mythological scene", "Battle painting"],
        ["Roman statue", "Islamic art", "Napoleon portrait"]
      ],
      embeddingVersion: 2,
      createdAt: "2025-02-20T14:30:00Z"
    }
  ],
  artworks: [
    {
      id: "art_001",
      museumId: "met_nyc",
      title: "Whistler's Mother",
      artist: "James McNeill Whistler",
      description: "Iconic painting of an elderly woman seated in profile.",
      imageS3Key: "museums/met_nyc/raw/art_001.jpg",
      resizedS3Key: "museums/met_nyc/resized/art_001.jpg",
      locationX: 24.5,
      locationY: 12.3,
      bingoTileId: "0_0",
      emoji: "🖼️"
    },
    {
      id: "art_002",
      museumId: "met_nyc",
      title: "The Thinker",
      artist: "Auguste Rodin",
      description: "Bronze sculpture of a nude male figure sitting on a rock, deep in thought.",
      imageS3Key: "museums/met_nyc/raw/art_002.jpg",
      resizedS3Key: "museums/met_nyc/resized/art_002.jpg",
      locationX: 45.2,
      locationY: 20.1,
      bingoTileId: "0_1",
      emoji: "🗿"
    },
    {
      id: "art_003",
      museumId: "met_nyc",
      title: "Self-Portrait with a Straw Hat",
      artist: "Vincent van Gogh",
      description: "The artist looks at the viewer with intense, suspicious eyes.",
      imageS3Key: "museums/met_nyc/raw/art_003.jpg",
      resizedS3Key: "museums/met_nyc/resized/art_003.jpg",
      locationX: 60.0,
      locationY: 55.0,
      bingoTileId: "0_2",
      emoji: "🎨"
    }
  ],
  users: [
    {
      uid: "user_alex",
      email: "alex@example.com",
      displayName: "Alex Martinez",
      photoURL: "https://randomuser.me/api/portraits/men/1.jpg",
      isPremium: true,
      totalBingos: 12,
      createdAt: "2025-03-01T08:00:00Z"
    },
    {
      uid: "user_jordan",
      email: "jordan@example.com",
      displayName: "Jordan Lee",
      photoURL: "https://randomuser.me/api/portraits/women/2.jpg",
      isPremium: false,
      totalBingos: 3,
      createdAt: "2025-04-10T12:00:00Z"
    }
  ],
  leaderboards: [
    {
      id: "met_nyc_2025-05-27",
      museumId: "met_nyc",
      date: "2025-05-27",
      topPlayers: [
        { userId: "user_alex", displayName: "Alex Martinez", score: 120 },
        { userId: "user_taylor", displayName: "Taylor Smith", score: 95 },
        { userId: "user_jordan", displayName: "Jordan Lee", score: 45 }
      ]
    }
  ],
  achievements: [
    {
      id: "first_scan",
      name: "First Scan",
      description: "Complete your first successful scan.",
      icon: "📸",
      rarity: "common"
    },
    {
      id: "museum_explorer",
      name: "Museum Explorer",
      description: "Complete every tile on a card.",
      icon: "🗺️",
      rarity: "epic"
    }
  ],
  dailyChallenges: [
    {
      dateKey: "2026-05-29",
      museumId: "met_nyc",
      promptSetId: "met_daily_alpha",
      bonusPoints: 200,
      leaderboardType: "daily"
    }
  ],
  scanEvents: [
    {
      id: "evt_seed_room_joined",
      type: "room_joined",
      roomId: "DEMO42",
      userId: "user_alex",
      timestamp: "2026-05-29T10:00:00.000Z",
      payload: { source: "seed" }
    }
  ]
};

window.MOCK_DATA = MOCK_DATA;
