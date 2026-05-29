// Museum Bingo AI: Premium AR Experience - Main Logic
// Optimized for DeveloperWeek New York 2026 Hackathon

const themes = {
    art: {
        name: "Art Gallery",
        color: "#fbbf24",
        items: [
            { id: 1, name: "Oil Painting", emoji: "🖼️", fact: "Oil paintings were perfected during the Renaissance." },
            { id: 2, name: "Ancient Statue", emoji: "🗿", fact: "Easter Island Moai weigh about 80 tons!" },
            { id: 3, name: "Ceramic Vase", emoji: "🏺", fact: "Ancient Greeks used these for wine and water." },
            { id: 4, name: "Abstract Art", emoji: "🎨", fact: "Abstract art emerged in the early 1900s." },
            { id: 5, name: "Golden Mask", emoji: "🎭", fact: "Tutankhamun's mask is solid gold!" },
            { id: 6, name: "Ancient Map", emoji: "🗺️", fact: "The oldest map is from Babylon (600 BCE)." },
            { id: 7, name: "Medieval Armor", emoji: "🛡️", fact: "Knights' armor could weigh 60 pounds." },
            { id: 8, name: "Precious Jewelry", emoji: "💎", fact: "The Hope Diamond is 45.52 carats." },
            { id: 9, name: "Dinosaur Skeleton", emoji: "🦴", fact: "Sue is the most complete T-Rex fossil." }
        ]
    },
    history: {
        name: "Natural History",
        color: "#10b981",
        items: [
            { id: 10, name: "Mammoth Tusk", emoji: "🐘", fact: "Mammoths lived during the Ice Age." },
            { id: 11, name: "Ammonite Fossil", emoji: "🐚", fact: "Ammonites are extinct marine mollusks." },
            { id: 12, name: "Crystal Cluster", emoji: "🔮", fact: "Crystals grow in repeating patterns." },
            { id: 13, name: "Meteorite", emoji: "☄️", fact: "Meteorites are space rocks that hit Earth." },
            { id: 14, name: "Tribal Mask", emoji: "👺", fact: "Masks are used in many cultural rituals." },
            { id: 15, name: "Obsidian Spear", emoji: "🗡️", fact: "Obsidian is volcanic glass." },
            { id: 16, name: "Butterfly Box", emoji: "🦋", fact: "Butterflies go through metamorphosis." },
            { id: 17, name: "Ancient Coin", emoji: "🪙", fact: "Lydians invented coins around 600 BCE." },
            { id: 18, name: "Shark Tooth", emoji: "🦈", fact: "Megalodon teeth can be 7 inches long!" }
        ]
    },
    science: {
        name: "Science Center",
        color: "#3b82f6",
        items: [
            { id: 19, name: "Space Suit", emoji: "👨‍🚀", fact: "Space suits protect from extreme temps." },
            { id: 20, name: "Robot Arm", emoji: "🦾", fact: "Robots are used in car manufacturing." },
            { id: 21, name: "Microscope", emoji: "🔬", fact: "Microscopes reveal the tiny world." },
            { id: 22, name: "Tesla Coil", emoji: "⚡", fact: "Tesla coils produce high-voltage electricity." },
            { id: 23, name: "Rocket Model", emoji: "🚀", fact: "Rockets work on Newton's third law." },
            { id: 24, name: "DNA Model", emoji: "🧬", fact: "DNA is the blueprint of life." },
            { id: 25, name: "Solar Panel", emoji: "☀️", fact: "Solar panels turn light into electricity." },
            { id: 26, name: "Atom Model", emoji: "⚛️", fact: "Atoms are the building blocks of matter." },
            { id: 27, name: "VR Headset", emoji: "🥽", fact: "VR creates immersive digital worlds." }
        ]
    }
};

// Game State
let currentTheme = 'art';
let gameState = {
    selectedCell: null,
    foundItems: new Set(),
    startTime: Date.now(),
    totalAttempts: 0,
    successfulScans: 0,
    aiDetections: 0,
    cameraStream: null,
    currentRiddleIndex: {},
    exp: 0,
    level: 1,
    tutorialStep: 0,
    audioCtx: null,
    isHeatVisionActive: false
};

const passport = JSON.parse(localStorage.getItem('museumPassport') || '{}');

// DOM Elements (Centralized References)
const DOM = {
    board: document.getElementById('bingo-board'),
    scanBtn: document.getElementById('scan-btn'),
    resetBtn: document.getElementById('reset-btn'),
    scannerOverlay: document.getElementById('scanner-overlay'),
    closeScanner: document.getElementById('close-scanner'),
    confirmBtn: document.getElementById('confirm-btn'),
    statusMsg: document.getElementById('status-msg'),
    cameraFeed: document.getElementById('camera-feed'),
    detectionCanvas: document.getElementById('detection-canvas'),
    artInfo: document.getElementById('art-info'),
    foundCount: document.getElementById('found-count'),
    accuracy: document.getElementById('accuracy'),
    timeElapsed: document.getElementById('time-elapsed'),
    aiDetectionsDisplay: document.getElementById('ai-detections'),
    winModal: document.getElementById('win-modal'),
    riddlePanel: document.getElementById('riddle-panel'),
    riddleText: document.getElementById('riddle-text'),
    nextRiddleBtn: document.getElementById('next-riddle-btn'),
    themeSelect: document.getElementById('museum-theme'),
    viewPassportBtn: document.getElementById('view-passport'),
    closePassportBtn: document.getElementById('close-passport'),
    passportModal: document.getElementById('passport-modal'),
    passportGrid: document.getElementById('passport-grid'),
    tutorialOverlay: document.getElementById('tutorial-overlay'),
    tutorialNextBtn: document.getElementById('tutorial-next'),
    tutorialSkipBtn: document.getElementById('tutorial-skip'),
    tutorialStepIcon: document.getElementById('tutorial-step-icon'),
    tutorialStepTitle: document.getElementById('tutorial-step-title'),
    tutorialStepText: document.getElementById('tutorial-step-text'),
    userLevel: document.getElementById('user-level'),
    levelProgress: document.getElementById('level-progress'),
    finalStats: document.getElementById('final-stats'),
    playAgainBtn: document.getElementById('play-again-btn'),
    heatVisionBtn: document.getElementById('heat-vision-btn'),
    detectedObjects: document.getElementById('detected-objects'),
    confidence: document.getElementById('confidence'),
    detectionResults: document.getElementById('detection-results'),
    artEmoji: document.getElementById('art-emoji'),
    artName: document.getElementById('art-name'),
    artFact: document.getElementById("art-fact"),
    vrHud: document.getElementById("vr-hud"),
};

// Sound System (Web Audio API)
function playSound(freq, type = 'sine', duration = 0.1, volume = 0.1) {
    try {
        if (!gameState.audioCtx) gameState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (gameState.audioCtx.state === 'suspended') gameState.audioCtx.resume();
        
        const osc = gameState.audioCtx.createOscillator();
        const gain = gameState.audioCtx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, gameState.audioCtx.currentTime);
        
        gain.gain.setValueAtTime(volume, gameState.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, gameState.audioCtx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(gameState.audioCtx.destination);
        
        osc.start();
        osc.stop(gameState.audioCtx.currentTime + duration);
    } catch (e) { console.warn("Audio failed", e); }
}

const sounds = {
    click: () => playSound(600, 'sine', 0.1, 0.1),
    select: () => playSound(800, 'triangle', 0.15, 0.1),
    found: () => {
        playSound(523.25, 'sine', 0.2, 0.1);
        setTimeout(() => playSound(659.25, 'sine', 0.2, 0.1), 100);
        setTimeout(() => playSound(783.99, 'sine', 0.3, 0.1), 200);
    },
    levelUp: () => {
        [440, 554, 659, 880].forEach((f, i) => {
            setTimeout(() => playSound(f, 'square', 0.2, 0.05), i * 150);
        });
    }
};

const tutorialSteps = [
    { icon: "🎯", title: "Welcome Explorer!", text: "Ready to discover the secrets of the museum? Let's show you how to use your AI scanner." },
    { icon: "🖼️", title: "Pick an Object", text: "Tap any tile on the bingo board to select an art piece. You'll get a special AI riddle to solve!" },
    { icon: "📷", title: "Scan & Find", text: "Click 'AI SCAN' and point your camera at the real art piece. Our AI will identify it instantly!" }
];

// GameManager Object for Encapsulation
const GameManager = {
    init: function() {
        this.initGame();
        this.bindEvents();
        this.loadLeaderboard();
        if (!localStorage.getItem('museumBingoTutorialSeen')) {
            this.showTutorialStep();
        }
        setInterval(this.updateStats.bind(this), 1000);
    },

    loadMockUser: function(uid) {
        const user = window.MOCK_DATA.users.find(u => u.uid === uid);
        if (user) {
            gameState.currentUser = user;
            gameState.exp = user.totalBingos * 100;
            gameState.level = Math.floor(gameState.exp / 100) + 1;
            document.getElementById('mock-user-info').textContent = `Logged in as: ${user.displayName} (${user.isPremium ? 'Premium' : 'Standard'})`;
            this.updateStats();
            sounds.levelUp();
        }
    },

    loadLeaderboard: function() {
        const list = document.getElementById('leaderboard-list');
        if (!list) return;
        list.innerHTML = '';
        const data = window.MOCK_DATA.leaderboards[0].topPlayers;
        data.forEach((player, i) => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between p-3 glass-card bg-white/5';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="text-amber-300 font-bold">#${i + 1}</span>
                    <span class="text-white">${player.displayName}</span>
                </div>
                <span class="text-amber-400 font-black">${player.score} pts</span>
            `;
            list.appendChild(item);
        });
    },

    initGame: function() {
        const theme = themes[currentTheme];
        DOM.board.innerHTML = '';
        theme.items.forEach((item) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.id = item.id;
            const isFound = gameState.foundItems.has(item.id);
            if (isFound) cell.classList.add('found');
            cell.innerHTML = `<span>${item.emoji}</span><div class="cell-name">${item.name}</div>`;
            cell.onclick = () => this.selectCell(cell, item);
            DOM.board.appendChild(cell);
        });
        this.updateStats();
        this.applyThemeColors(theme.color);
    },

    applyThemeColors: function(color) {
        document.documentElement.style.setProperty('--gold', color);
        if (document.querySelector('h1')) {
            document.querySelector('h1').style.backgroundImage = `linear-gradient(to right, ${color}, white)`;
        }
    },

    bindEvents: function() {
        if (DOM.themeSelect) {
            DOM.themeSelect.onchange = (e) => {
                sounds.click();
                currentTheme = e.target.value;
                gameState.foundItems = new Set();
                this.initGame();
            };
        }

        if (DOM.viewPassportBtn) {
            DOM.viewPassportBtn.onclick = () => {
                DOM.passportGrid.innerHTML = '';
                Object.keys(themes).forEach(themeKey => {
                    const theme = themes[themeKey];
                    const foundInTheme = passport[themeKey] || [];
                    const stamp = document.createElement('div');
                    stamp.className = 'glass-card p-4 text-center';
                    stamp.innerHTML = `
                        <div class="text-3xl mb-2">${foundInTheme.length >= 9 ? '🏆' : '🎫'}</div>
                        <div class="text-xs font-bold text-amber-300">${theme.name}</div>
                        <div class="text-[10px] text-amber-100">${foundInTheme.length}/9 FOUND</div>
                    `;
                    DOM.passportGrid.appendChild(stamp);
                });
                DOM.passportModal.classList.remove('hidden');
            };
        }

        if (DOM.closePassportBtn) {
            DOM.closePassportBtn.onclick = () => {
                DOM.passportModal.classList.add('hidden');
            };
        }

        DOM.scanBtn.onclick = this.handleScanClick.bind(this);
        DOM.closeScanner.onclick = this.closeScannerModal.bind(this);
        DOM.confirmBtn.onclick = this.handleConfirmClick.bind(this);
        DOM.resetBtn.onclick = this.resetGame.bind(this);
        DOM.nextRiddleBtn.addEventListener('click', this.showNextRiddle.bind(this));
        if (DOM.tutorialNextBtn) DOM.tutorialNextBtn.onclick = this.nextTutorialStep.bind(this);
        if (DOM.tutorialSkipBtn) DOM.tutorialSkipBtn.onclick = this.closeTutorial.bind(this);
        if (DOM.playAgainBtn) DOM.playAgainBtn.onclick = () => location.reload();
        if (DOM.heatVisionBtn) DOM.heatVisionBtn.onclick = this.toggleHeatVision.bind(this);

        window.addEventListener('beforeunload', this.cleanupCamera.bind(this));
    },

    selectCell: function(element, item) {
        if (element.classList.contains('found')) return;
        sounds.select();
        
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('active'));
        element.classList.add('active');
        gameState.selectedCell = { element, item };
        
        this.showRiddle(item.id);
        DOM.statusMsg.innerHTML = `<span class="text-lg">🎯</span> Find the <strong>${item.name}</strong>!`;
    },

    showRiddle: function(artId) {
        if (!gameState.currentRiddleIndex[artId]) {
            gameState.currentRiddleIndex[artId] = 0;
        }
        
        const riddles = riddleDatabase[artId] || ["Can you find this art piece?"];
        const riddle = riddles[gameState.currentRiddleIndex[artId]];
        
        DOM.riddleText.textContent = riddle;
        DOM.riddlePanel.classList.remove('hidden');
        speakText(riddle, 0.9);
    },

    showNextRiddle: function() {
        if (!gameState.selectedCell) return;
        const artId = gameState.selectedCell.item.id;
        const riddles = riddleDatabase[artId];
        gameState.currentRiddleIndex[artId] = (gameState.currentRiddleIndex[artId] + 1) % riddles.length;
        this.showRiddle(artId);
    },

    handleScanClick: async function() {
        if (!gameState.selectedCell) {
            DOM.statusMsg.innerHTML = '⚠️ Please select an art piece first!';
            return;
        }
        
        gameState.totalAttempts++;
        DOM.scannerOverlay.classList.remove('hidden');
        DOM.artInfo.classList.add('hidden');
        DOM.confirmBtn.classList.add('hidden');
        DOM.detectionResults.classList.add('hidden');
        
        try {
            document.querySelector('.scan-border').classList.add('scanning-active');
            if (!gameState.cameraStream) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });
                gameState.cameraStream = stream;
                DOM.cameraFeed.srcObject = stream;
                DOM.cameraFeed.onloadedmetadata = () => {
                    DOM.detectionCanvas.width = DOM.cameraFeed.videoWidth;
                    DOM.detectionCanvas.height = DOM.cameraFeed.videoHeight;
                };
            }
            await this.startAIDetection();
        } catch (err) {
            console.warn('Camera failed, using fallback', err);
            await this.startAIDetection(); // Attempt simulation even if camera fails
        } finally {
            document.querySelector('.scan-border').classList.remove('scanning-active');
        }
    },

    startAIDetection: async function() {
        const result = await simulateAIDetection(DOM.cameraFeed, DOM.detectionCanvas, gameState.selectedCell.item);
        gameState.aiDetections += result.detectionCount;
        if (result.confidence >= 80) {
            this.showDetectionResult();
        } else {
            DOM.statusMsg.innerHTML = '⚠️ AI confidence too low. Try again!';
            this.closeScannerModal();
        }
    },

    showDetectionResult: function() {
        const item = gameState.selectedCell.item;
        DOM.artInfo.classList.remove('hidden');
        DOM.artEmoji.textContent = item.emoji;
        DOM.artName.textContent = item.name;
        DOM.artFact.textContent = item.fact;
        DOM.confirmBtn.classList.remove('hidden');
        speakText(`Found ${item.name}! ${item.fact}`, 0.85);
    },

    handleConfirmClick: async function(e) {
        DOM.confirmBtn.disabled = true;
        DOM.confirmBtn.textContent = 'VALIDATING...';
        
        const item = gameState.selectedCell.item;
        const validation = await window.TechnicalEngine.validateArtwork(null, item);
        
        if (validation.success) {
            sounds.found();
            gameState.foundItems.add(item.id);
            gameState.successfulScans++;
            gameState.selectedCell.element.classList.add('found');
            gameState.selectedCell.element.classList.remove('active');
            
            this.addExp(50);
            this.stampPassport(item);
            
            this.closeScannerModal();
            DOM.statusMsg.innerHTML = `<span class="text-lg">✅</span> Great! You found the <strong>${item.text}</strong>!`;
            DOM.riddlePanel.classList.add('hidden');
            this.updateStats();
            this.checkWin();

            // Reward logic for Bingo Line
            if (gameState.foundItems.size >= 3) {
                document.getElementById('rewards-panel').classList.remove('hidden');
            }
        } else {
            DOM.statusMsg.innerHTML = '❌ Validation failed. Try a different angle!';
        }
        
        DOM.confirmBtn.disabled = false;
        DOM.confirmBtn.textContent = '✓ FOUND IT!';
    },

    closeScannerModal: function() {
        DOM.scannerOverlay.classList.add('hidden');
        if (gameState.cameraStream) {
            gameState.cameraStream.getTracks().forEach(track => track.stop());
            gameState.cameraStream = null;
        }
    },

    resetGame: function() {
        gameState.foundItems = new Set();
        gameState.startTime = Date.now();
        gameState.totalAttempts = 0;
        gameState.successfulScans = 0;
        gameState.aiDetections = 0;
        gameState.selectedCell = null;
        gameState.exp = 0;
        gameState.level = 1;
        gameState.currentRiddleIndex = {};
        this.initGame();
        DOM.statusMsg.innerHTML = '👉 Select an art piece to begin your journey';
        DOM.riddlePanel.classList.add('hidden');
        this.closeScannerModal();
        this.updateLevelUI();
    },

    checkWin: function() {
        const cells = Array.from(document.querySelectorAll('.cell'));
        const found = cells.map(c => c.classList.contains('found'));
        const winPatterns = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
        const hasWon = winPatterns.some(pattern => pattern.every(idx => found[idx]));
        if (hasWon) setTimeout(this.showWinModal.bind(this), 500);
    },

    showWinModal: function() {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const scanAccuracy = gameState.totalAttempts > 0 
            ? Math.round((gameState.successfulScans / gameState.totalAttempts) * 100)
            : 0;
        
        DOM.finalStats.innerHTML = `
            <div class="flex justify-between mb-3 text-amber-100"><span>⏱️ Time:</span><strong class="text-amber-300">${elapsed}s</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>📊 Scans:</span><strong class="text-amber-300">${gameState.successfulScans}/${gameState.totalAttempts}</strong></div>
            <div class="flex justify-between mb-3 text-amber-100"><span>🤖 AI Detections:</span><strong class="text-amber-300">${gameState.aiDetections}</strong></div>
            <div class="flex justify-between text-amber-100"><span>🎯 Accuracy:</span><strong class="text-amber-300">${scanAccuracy}%</strong></div>
        `;
        DOM.winModal.classList.remove('hidden');
        speakText('Congratulations! You won the museum bingo game!', 1);
    },

    updateStats: function() {
        DOM.foundCount.textContent = `${gameState.foundItems.size}/9`;
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        DOM.timeElapsed.textContent = elapsed + 's';
        const scanAccuracy = gameState.totalAttempts > 0
            ? Math.round((gameState.successfulScans / gameState.totalAttempts) * 100)
            : 0;
        DOM.accuracy.textContent = scanAccuracy + '%';
        DOM.aiDetectionsDisplay.textContent = gameState.aiDetections;
    },

    showTutorialStep: function() {
        const step = tutorialSteps[gameState.tutorialStep];
        DOM.tutorialStepIcon.textContent = step.icon;
        DOM.tutorialStepTitle.textContent = step.title;
        DOM.tutorialStepText.textContent = step.text;
        const dots = document.querySelectorAll('.tutorial-dot');
        dots.forEach((dot, i) => {
            dot.className = `tutorial-dot w-2 h-2 rounded-full ${i === gameState.tutorialStep ? 'bg-amber-400' : 'bg-white/20'}`;
        });
        DOM.tutorialOverlay.classList.remove('hidden');
        speakText(step.text);
    },

    nextTutorialStep: function() {
        sounds.click();
        gameState.tutorialStep++;
        if (gameState.tutorialStep < tutorialSteps.length) this.showTutorialStep();
        else this.closeTutorial();
    },

    closeTutorial: function() {
        DOM.tutorialOverlay.classList.add('hidden');
        localStorage.setItem('museumBingoTutorialSeen', 'true');
    },

    addExp: function(amount) {
        gameState.exp += amount;
        const expToLevel = gameState.level * 100;
        if (gameState.exp >= expToLevel) {
            gameState.level++;
            gameState.exp -= expToLevel;
            this.showLevelUp();
        }
        this.updateLevelUI();
    },

    updateLevelUI: function() {
        DOM.userLevel.textContent = `LVL ${gameState.level}`;
        const expToLevel = gameState.level * 100;
        const progress = (gameState.exp / expToLevel) * 100;
        DOM.levelProgress.style.width = `${progress}%`;
    },

    showLevelUp: function() {
        sounds.levelUp();
        DOM.statusMsg.innerHTML = `<span class="text-2xl animate-bounce">🌟</span> LEVEL UP! You are now Level ${gameState.level}!`;
        speakText(`Level up! You are now level ${gameState.level}`);
        this.createParticles(window.innerWidth / 2, window.innerHeight / 2, '#fbbf24', 30);
    },

    createParticles: function(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.backgroundColor = color;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 100 + 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
    },

    cleanupCamera: function() {
        if (gameState.cameraStream) {
            gameState.cameraStream.getTracks().forEach(track => track.stop());
        }
        synth.cancel();
    }
};

// Initialize GameManager on Load
window.addEventListener('load', () => {
    GameManager.init();
});

// Expose toggleHeatVision globally for onclick in index.html
    toggleHeatVision: function() {
        gameState.isHeatVisionActive = !gameState.isHeatVisionActive;
        if (DOM.heatVisionBtn) {
            DOM.heatVisionBtn.classList.toggle("bg-orange-500", gameState.isHeatVisionActive);
            DOM.heatVisionBtn.textContent = gameState.isHeatVisionActive ? "🔥 HEAT VISION ON" : "🔍 HEAT VISION";
        }
        
        if (gameState.isHeatVisionActive) {
            speakText("Heat vision activated. Look for the orange glow.");
            this.startHeatVisionLoop();
        } else {
            if (DOM.cameraFeed) DOM.cameraFeed.style.filter = "none";
            if (DOM.vrHud) DOM.vrHud.classList.add("hidden");
        }
    },

    startHeatVisionLoop: function() {
        if (!gameState.isHeatVisionActive) return;
        
        if (DOM.cameraFeed) DOM.cameraFeed.style.filter = "sepia(1) saturate(5) hue-rotate(-50deg)";
        if (DOM.vrHud) DOM.vrHud.classList.remove("hidden");
        
        requestAnimationFrame(this.startHeatVisionLoop.bind(this));
    }
