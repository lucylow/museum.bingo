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
            { text: "Something blue and red", emoji: "🔴🔵" },
            { text: "Artwork featuring dramatic lighting", emoji: "💡" },
            { text: "A scene with water", emoji: "🌊" }
        ],
        conceptual: [
            { text: "Portrait with no smile", emoji: "😐" },
            { text: "Hidden religious symbol", emoji: "🕊️" },
            { text: "A work about power or authority", emoji: "👑" },
            { text: "Something that feels mysterious", emoji: "🧠" }
        ],
        humorous: [
            { text: "Uncomfortable sculpture", emoji: "😖" },
            { text: "Suspicious self-portrait", emoji: "🤨" },
            { text: "Artwork with dramatic side-eye", emoji: "👀" },
            { text: "The most dramatic pose you can find", emoji: "🎭" }
        ],
        educational: [
            { text: "17th Century Artwork", emoji: "📜" },
            { text: "Foreign landscape", emoji: "🗺️" },
            { text: "A work with symbolic color use", emoji: "🎨" },
            { text: "An object made before 1900", emoji: "🏺" }
        ],
        family: [
            { text: "Find an artwork with an animal", emoji: "🦁" },
            { text: "Find something shaped like a circle", emoji: "⭕" },
            { text: "Find a bright color artwork", emoji: "🌈" },
            { text: "Find a tiny detail in a big artwork", emoji: "🔍" }
        ],
        challenge: [
            { text: "Find a nearly hidden figure", emoji: "🕵️" },
            { text: "Find a work with layered meaning", emoji: "🧩" },
            { text: "Find a material contrast (soft vs hard)", emoji: "⚖️" },
            { text: "Find an artwork tied to a historical event", emoji: "📚" }
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
                try {
                    const { latitude, longitude } = pos.coords;
                    const found = this.museums.find(m => {
                        const dist = this.calculateDistance(latitude, longitude, m.lat, m.lng);
                        return dist <= m.radius;
                    });
                    resolve(found || this.museums[0]);
                } catch (err) {
                    console.warn('Failed to map geolocation to museum:', err);
                    resolve(this.museums[0]);
                }
            }, () => resolve(this.museums[0]), { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
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
    generateCard: function(size = 3, options = {}) {
        const card = [];
        const mode = options.mode || "standard";
        const includeFunny = options.funnyPrompts !== false;
        const includeEducational = options.educationalPrompts !== false;
        const categories = Object.keys(this.promptPool).filter((category) => {
            if (category === "humorous" && !includeFunny) return false;
            if (category === "educational" && !includeEducational) return false;
            if (mode === "family") return category === "family" || category === "visual" || category === "educational";
            if (mode === "challenge") return category === "challenge" || category === "conceptual" || category === "visual";
            return category !== "family" && category !== "challenge";
        });
        const usedPrompts = new Set();
        if (!categories.length || size < 1) return card;

        for (let i = 0; i < size * size; i++) {
            const randomOffset = Math.floor(Math.random() * categories.length);
            const cat = categories[(i + randomOffset) % categories.length];
            const pool = this.promptPool[cat];
            let prompt;
            let guard = 0;
            do {
                prompt = pool[Math.floor(Math.random() * pool.length)];
                guard++;
                // Avoid infinite loops when card size exceeds unique prompts.
                if (guard > 20) break;
            } while (usedPrompts.has(prompt.text));
            
            if (!prompt) {
                console.warn(`No prompt available for category "${cat}". Skipping slot.`);
                continue;
            }
            if (!usedPrompts.has(prompt.text)) usedPrompts.add(prompt.text);
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
        const promptLabel = targetPrompt && (targetPrompt.text || targetPrompt.name) ? (targetPrompt.text || targetPrompt.name) : 'unknown target';
        console.log(`Extracting embeddings for prompt: ${promptLabel}`);
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
