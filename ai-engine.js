// AI Engine: TensorFlow.js + Web Speech API + Voice Guide
// Optimized for Museum Bingo AR Experience

let aiModel = null;
let voiceEnabled = true;
const synth = window.speechSynthesis;

// Initialize AI Model
async function initializeAI() {
    try {
        // Load COCO-SSD model for real-time object detection
        aiModel = await cocoSsd.load();
        updateAIStatus('Ready ✓');
        console.log('AI Model loaded successfully');
    } catch (err) {
        console.error('Failed to load AI model:', err);
        updateAIStatus('Fallback Mode');
    }
}

// Update AI Status Display
function updateAIStatus(status) {
    const statusEl = document.getElementById('ai-ready');
    if (statusEl) statusEl.textContent = status;
}

// Real-time Object Detection
async function detectObjects(videoElement) {
    if (!aiModel) return null;
    try {
        // Perform inference on the video frame
        const predictions = await aiModel.detect(videoElement);
        return predictions;
    } catch (err) {
        console.error('Detection error:', err);
        return null;
    }
}

// Draw Detection Boxes on Canvas
function drawDetections(canvas, predictions) {
    if (!predictions) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    predictions.forEach(pred => {
        const [x, y, width, height] = pred.bbox;
        // Draw bounding box with gold color
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Draw label background
        ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
        const label = `${pred.class} (${Math.round(pred.score * 100)}%)`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x, y - 25, textWidth + 10, 25);
        
        // Draw label text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(label, x + 5, y - 8);
    });
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
    if (!voiceEnabled || !synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    synth.speak(utterance);
}

// AI Confidence Simulation with Real Detection
async function simulateAIDetection(videoElement, canvas, targetArt) {
    let confidence = 0;
    let detectionCount = 0;
    const maxAttempts = 30;
    
    return new Promise((resolve) => {
        const detectionInterval = setInterval(async () => {
            const predictions = await detectObjects(videoElement);
            
            // Simulate more advanced AR tracking with dynamic movement and size changes
            const arTargets = document.querySelectorAll(".ar-target");
            arTargets.forEach((target) => {
                const randX = (Math.random() - 0.5) * 20; // -10 to 10
                const randY = (Math.random() - 0.5) * 20; // -10 to 10
                const randScale = 1 + (Math.random() - 0.5) * 0.2; // 0.9 to 1.1
                target.style.transform = `translate(${randX}px, ${randY}px) scale(${randScale})`;
            });

            // Update VR HUD with simulated data
            const vrHud = document.getElementById("vr-hud");
            if (vrHud && !vrHud.classList.contains("hidden")) {
                const targetName = targetArt ? targetArt.name : "Unknown";
                const signalStrength = Math.floor(Math.random() * 100);
                const thermalSignature = Math.floor(Math.random() * 200) + 50; // 50-250
                vrHud.innerHTML = `
                    <div class="vr-hud-line"></div>
                    <div class="vr-hud-text">TARGET: ${targetName.toUpperCase()}</div>
                    <div class="vr-hud-text">SIGNAL: ${signalStrength}%</div>
                    <div class="vr-hud-text">THERMAL: ${thermalSignature}°C</div>
                    <div class="vr-hud-line"></div>
                `;
            }

            if (predictions && predictions.length > 0) {
                drawDetections(canvas, predictions);
                // Increase confidence based on detection quality
                const topScore = Math.max(...predictions.map(p => p.score));
                confidence += (topScore * 15) + 5;
                detectionCount++;
                
                const objects = predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`).join(', ');
                const resultsEl = document.getElementById('detected-objects');
                if (resultsEl) resultsEl.textContent = objects;
                const resultsContainer = document.getElementById('detection-results');
                if (resultsContainer) resultsContainer.classList.remove('hidden');
            } else {
                // In simulation mode, we still want to show progress if we see anything
                confidence += Math.random() * 8;
            }
            
            if (confidence > 100) confidence = 100;
            const confidenceEl = document.getElementById('confidence');
            if (confidenceEl) confidenceEl.textContent = Math.floor(confidence) + '%';
            
            if (confidence >= 100 || detectionCount >= maxAttempts) {
                clearInterval(detectionInterval);
                resolve({ confidence: Math.min(confidence, 100), detectionCount });
            }
        }, 300);
    });
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
        speakText(voiceEnabled ? 'Voice guide enabled' : 'Voice guide disabled');
    });
}
