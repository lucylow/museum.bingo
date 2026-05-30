// AI Engine: TensorFlow.js + Web Speech API + Voice Guide
// Optimized for Museum Bingo AR Experience

let aiModel = null;
let voiceEnabled = true;
const synth = window.speechSynthesis;
let aiModelLoadPromise = null;
const MIN_PREDICTION_SCORE = 0.55;
const MAX_VISIBLE_PREDICTIONS = 4;
const MAX_ATTEMPTS = 30;
const DETECTION_INTERVAL_MS = 300;

function t(key, params = {}) {
    if (window.I18n && typeof window.I18n.t === "function") return window.I18n.t(key, params);
    return key;
}

const targetDetectionHints = {
    1: ['book', 'tv', 'person', 'tie'],
    2: ['person'],
    3: ['cup', 'bottle', 'bowl', 'vase'],
    4: ['tv', 'book'],
    5: ['person'],
    6: ['book'],
    7: ['person'],
    8: ['clock', 'cup', 'bottle'],
    9: ['dining table', 'chair']
};

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize AI Model
async function initializeAI() {
    if (aiModel) return aiModel;
    if (aiModelLoadPromise) return aiModelLoadPromise;

    updateAIStatus(t("scan.scanning"));
    try {
        if (typeof cocoSsd === 'undefined' || typeof cocoSsd.load !== 'function') {
            throw new Error('cocoSsd loader is unavailable');
        }
        aiModelLoadPromise = cocoSsd.load();
        aiModel = await aiModelLoadPromise;
        updateAIStatus(t("scan.recognized"));
        console.log('AI model loaded successfully');
        return aiModel;
    } catch (err) {
        console.error('Failed to load AI model:', err);
        updateAIStatus(t("language.incomplete"));
        return null;
    } finally {
        aiModelLoadPromise = null;
    }
}

// Update AI Status Display
function updateAIStatus(status) {
    const statusEl = document.getElementById('ai-ready');
    if (statusEl) statusEl.textContent = status;
}

// Real-time Object Detection
async function detectObjects(videoElement) {
    if (!videoElement || videoElement.readyState < 2) return [];
    if (!aiModel) {
        await initializeAI();
    }
    if (!aiModel) return [];

    try {
        const predictions = await aiModel.detect(videoElement);
        if (!Array.isArray(predictions)) return [];
        return predictions
            .filter((pred) => pred && Number.isFinite(pred.score) && pred.score >= MIN_PREDICTION_SCORE)
            .sort((a, b) => b.score - a.score)
            .slice(0, MAX_VISIBLE_PREDICTIONS);
    } catch (err) {
        console.error('Detection error:', err);
        return [];
    }
}

// Draw Detection Boxes on Canvas
function drawDetections(canvas, predictions) {
    if (!canvas || !Array.isArray(predictions)) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 14px sans-serif';
    
    predictions.forEach(pred => {
        if (!pred || !Array.isArray(pred.bbox) || pred.bbox.length < 4) return;
        const [x, y, width, height] = pred.bbox;
        if (![x, y, width, height].every(Number.isFinite)) return;
        // Draw bounding box with gold color
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        const label = `${pred.class} (${Math.round(pred.score * 100)}%)`;
        const textWidth = ctx.measureText(label).width;
        const labelY = Math.max(0, y - 25);
        ctx.fillRect(x, labelY, textWidth + 10, 25);
        
        // Draw label text
        ctx.fillStyle = '#0f172a';
        ctx.fillText(label, x + 5, labelY + 17);
    });
}

function getTargetHints(targetArt) {
    if (!targetArt || !targetArt.id) return [];
    return targetDetectionHints[targetArt.id] || [];
}

function hasHintMatch(predictions, targetArt) {
    const hints = getTargetHints(targetArt);
    if (!hints.length || !predictions.length) return false;
    return predictions.some((pred) => pred && typeof pred.class === 'string' && hints.includes(pred.class));
}

// AI Riddle Database
const riddleDatabase = {
    1: [
        "I was perfected during the Renaissance. Artists layered me to create depth and rich colors. What am I?",
        "I hang on museum walls and tell stories through brushstrokes. I'm not a photograph. What am I?",
        "Leonardo da Vinci mastered my technique. I take months to create but seconds to appreciate."
    ],
    2: [
        "I stand on a remote island and weigh 80 tons. I was carved by ancient hands. What am I?",
        "Easter Island is my home. I'm a massive stone figure that has watched over the Pacific for centuries.",
        "I'm a moai. I was carved between 1250-1500 CE. What am I?"
    ],
    3: [
        "Ancient Greeks used me to store wine and water. I'm decorated with stories of gods and heroes. What am I?",
        "I'm made of clay and fired in a kiln. I hold precious liquids in ancient homes. What am I?",
        "I'm a ceramic vessel from ancient Greece. My patterns tell epic tales. What am I?"
    ],
    4: [
        "I emerged in the early 1900s. I don't need to look like reality to be beautiful. What am I?",
        "Wassily Kandinsky believed I didn't need to represent anything real. What am I?",
        "I'm art that breaks free from realistic representation. What am I?"
    ],
    5: [
        "I'm made of solid gold and weigh 24 pounds. I protected a pharaoh's face in the afterlife. What am I?",
        "Tutankhamun wore me. I'm one of the most famous artifacts in the world. What am I?",
        "I'm a golden mask from ancient Egypt. I'm priceless and protected by glass. What am I?"
    ],
    6: [
        "I'm the oldest known map, created in Babylon around 600 BCE. I showed the world as a flat disk. What am I?",
        "I helped ancient people navigate and understand their world. I'm made of clay. What am I?",
        "I'm an ancient map surrounded by water. I'm from Babylon. What am I?"
    ],
    7: [
        "I weigh 50-60 pounds but knights could still fight in me. I protected warriors in battle. What am I?",
        "I'm made of metal and cover a knight's entire body. What am I?",
        "Medieval warriors wore me into battle. I'm heavy but well-balanced. What am I?"
    ],
    8: [
        "I'm the Hope Diamond, weighing 45.52 carats. I'm over 250 years old and priceless. What am I?",
        "I'm a precious gem that has been owned by royalty. I'm blue and famous. What am I?",
        "I'm jewelry made of the hardest natural material on Earth. What am I?"
    ],
    9: [
        "I'm Sue, the most complete T-Rex fossil ever found. I'm 42 feet long and 66 million years old. What am I?",
        "I'm a dinosaur skeleton discovered in South Dakota in 1990. I'm a T-Rex. What am I?",
        "I'm a prehistoric predator's bones, preserved for millions of years. What am I?"
    ]
};

// Text-to-Speech (Voice Guide)
function speakText(text, rate = 1) {
    if (!voiceEnabled || !synth || typeof text !== 'string' || !text.trim()) return;
    try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;
        synth.speak(utterance);
    } catch (err) {
        console.warn('Speech synthesis failed:', err);
        voiceEnabled = false;
    }
}

// AI Confidence Simulation with Real Detection
async function simulateAIDetection(videoElement, canvas, targetArt) {
    if (!targetArt || (!targetArt.id && !targetArt.name && !targetArt.text)) {
        throw new Error('Detection target is missing');
    }

    let confidence = 0;
    let detectionCount = 0;
    let attempts = 0;
    let consecutiveDetections = 0;

    while (attempts < MAX_ATTEMPTS && confidence < 100) {
        attempts++;
        let predictions = [];

        try {
            predictions = await detectObjects(videoElement);
        } catch (err) {
            console.error('Detection loop failed:', err);
        }
        if (!Array.isArray(predictions)) predictions = [];

        // Simulate AR target movement to keep visual feedback alive.
        const arTargets = document.querySelectorAll('.ar-target');
        arTargets.forEach((target) => {
            const randX = (Math.random() - 0.5) * 20;
            const randY = (Math.random() - 0.5) * 20;
            const randScale = 1 + (Math.random() - 0.5) * 0.2;
            target.style.transform = `translate(${randX}px, ${randY}px) scale(${randScale})`;
        });

        if (predictions.length > 0) {
            drawDetections(canvas, predictions);

            const topScore = predictions[0].score;
            const targetMatched = hasHintMatch(predictions, targetArt);
            consecutiveDetections++;
            detectionCount++;

            const stabilityBoost = Math.min(consecutiveDetections, 4);
            confidence += (topScore * 18) + stabilityBoost + (targetMatched ? 10 : 0);

            const objects = predictions
                .map((p) => `${p.class} (${Math.round(p.score * 100)}%)`)
                .join(', ');
            const resultsEl = document.getElementById('detected-objects');
            if (resultsEl) resultsEl.textContent = objects;
            const resultsContainer = document.getElementById('detection-results');
            if (resultsContainer) resultsContainer.classList.remove('hidden');
        } else {
            consecutiveDetections = 0;
            confidence += 2 + (Math.random() * 2);
        }

        if (confidence > 100) confidence = 100;

        const vrHud = document.getElementById('vr-hud');
        if (vrHud && !vrHud.classList.contains('hidden')) {
            const targetName = targetArt && typeof targetArt.name === 'string' ? targetArt.name : 'Unknown';
            const signalStrength = Math.floor(confidence);
            const thermalSignature = Math.floor(50 + (confidence * 1.5));
            vrHud.innerHTML = `
                <div class="vr-hud-line"></div>
                <div class="vr-hud-text">TARGET: ${targetName.toUpperCase()}</div>
                <div class="vr-hud-text">SIGNAL: ${signalStrength}%</div>
                <div class="vr-hud-text">THERMAL: ${thermalSignature}°C</div>
                <div class="vr-hud-line"></div>
            `;
        }

        const confidenceEl = document.getElementById('confidence');
        if (confidenceEl) confidenceEl.textContent = `${Math.floor(confidence)}%`;
        const confidenceFill = document.getElementById('confidence-fill');
        if (confidenceFill) confidenceFill.style.width = `${Math.floor(confidence)}%`;
        const guidanceEl = document.getElementById('scan-guidance');
        if (guidanceEl) {
            if (confidence < 35) guidanceEl.textContent = t("scan.guidanceNoMatch");
            else if (confidence < 70) guidanceEl.textContent = t("scan.guidanceAlmost");
            else guidanceEl.textContent = t("scan.recognized");
        }
        if (confidence >= 70 && confidence < 100) {
            window.dispatchEvent(new CustomEvent("museum-bingo-near-match", { detail: { confidence: Math.floor(confidence) } }));
        }

        if (confidence >= 100) break;
        await wait(DETECTION_INTERVAL_MS);
    }

    return { confidence: Math.min(confidence, 100), detectionCount };
}



// Expose initializeAI globally for script.js
window.initializeAI = initializeAI;

// Expose speakText globally for script.js
window.speakText = speakText;

// Expose simulateAIDetection globally for script.js
window.simulateAIDetection = simulateAIDetection;

initializeAI();

// Toggle Voice Guide
const voiceToggle = document.getElementById('voice-toggle');
if (voiceToggle) {
    voiceToggle.addEventListener('click', () => {
        voiceEnabled = !voiceEnabled;
        voiceToggle.textContent = voiceEnabled ? '🔊' : '🔇';
        speakText(voiceEnabled ? t("accessibility.voiceHint") : t("settings.sound"));
    });
}
