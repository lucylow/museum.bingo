/**
 * Museum Bingo Technical Engine
 * Handles Geofencing, Vector Embeddings, and Dynamic Prompt Generation
 */

const TechnicalEngine = {
    // Geofencing: Simulated museum coordinates
    museums: [
        { id: 'met_nyc', name: 'The Met', lat: 40.7794, lng: -73.9632, radius: 200 },
        { id: 'louvre_paris', name: 'Louvre', lat: 48.8606, lng: 2.3376, radius: 300 }
    ],

    // Prompt Categories
    promptPool: {
        visual: [
            { text: "Painting with a dog", emoji: "🐕" },
            { text: "Sculpture made of metal", emoji: "⚙️" },
            { text: "Something blue and red", emoji: "🔴🔵" }
        ],
        conceptual: [
            { text: "Portrait with no smile", emoji: "😐" },
            { text: "Hidden religious symbol", emoji: "🕊️" }
        ],
        humorous: [
            { text: "Uncomfortable sculpture", emoji: "😖" },
            { text: "Suspicious self-portrait", emoji: "🤨" }
        ],
        educational: [
            { text: "17th Century Artwork", emoji: "📜" },
            { text: "Foreign landscape", emoji: "🗺️" }
        ]
    },

    /**
     * Detect current museum via Geolocation API
     */
    detectMuseum: async function() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(this.museums[0]); // Fallback
                return;
            }

            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                const found = this.museums.find(m => {
                    const dist = this.calculateDistance(latitude, longitude, m.lat, m.lng);
                    return dist <= m.radius;
                });
                resolve(found || this.museums[0]);
            }, () => resolve(this.museums[0]));
        });
    },

    calculateDistance: function(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * Generate a balanced Bingo Card (3x3 or 4x4)
     */
    generateCard: function(size = 3) {
        const card = [];
        const categories = Object.keys(this.promptPool);
        const usedPrompts = new Set();

        for (let i = 0; i < size * size; i++) {
            const cat = categories[i % categories.length];
            const pool = this.promptPool[cat];
            let prompt;
            do {
                prompt = pool[Math.floor(Math.random() * pool.length)];
            } while (usedPrompts.has(prompt.text));
            
            usedPrompts.add(prompt.text);
            card.push({ ...prompt, id: `p_${i}`, category: cat });
        }
        return this.shuffle(card);
    },

    shuffle: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    },

    /**
     * Vector Embedding Validation (Simulated)
     * Compares visual features against pre-computed library
     */
    validateArtwork: async function(capturedImage, targetPrompt) {
        console.log(`Extracting embeddings for prompt: ${targetPrompt.text}`);
        // Simulate extraction delay
        await new Promise(r => setTimeout(r, 1500));
        
        // Simulation logic: Higher confidence if target matches prompt category logic
        const confidence = 0.85 + (Math.random() * 0.14); // 85% to 99%
        return {
            success: confidence >= 0.85,
            confidence: (confidence * 100).toFixed(2),
            timestamp: new Date().toISOString()
        };
    }
};

window.TechnicalEngine = TechnicalEngine;
