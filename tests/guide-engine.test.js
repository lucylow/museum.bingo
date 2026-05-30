const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const code = fs.readFileSync(path.join(__dirname, "..", "src", "game", "guides.js"), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(code, context);

const { GuideEngine } = context.window;

assert.ok(GuideEngine, "GuideEngine should be defined");
assert.ok(Array.isArray(GuideEngine.GUIDE_CAST), "Guide cast should be an array");
assert.ok(GuideEngine.GUIDE_CAST.length >= 6, "Guide cast should include six guides");

const familyGuide = GuideEngine.selectGuide({
    sessionType: "family",
    ageFriendlyMode: true,
    multiplayer: false,
    museumTheme: "art",
    difficulty: "easy",
    energyPreference: "calm"
});
assert.ok(["pico", "nova"].includes(familyGuide.id), "Family mode should prefer family-friendly guides");

const roomGuide = GuideEngine.selectGuide({
    sessionType: "competitive",
    multiplayer: true,
    difficulty: "challenge",
    energyPreference: "energetic"
});
assert.equal(roomGuide.id, "blaze", "Competitive energetic sessions should prefer Blaze");

const line = GuideEngine.renderGuideLine({
    guide: GuideEngine.pickGuideById("iris"),
    beat: "hint",
    context: { hintAction: "Try less glare and a cleaner frame." },
    previousLine: ""
});
assert.ok(line.length <= 160, "Guide line should stay mobile-friendly");

const throttled = GuideEngine.shouldThrottleDialogue({
    beat: "hint",
    now: 10000,
    lastLineAt: 8000,
    lastBeat: "hint",
    minGapMs: 3000
});
assert.equal(throttled, true, "Recent same beat should throttle");

const notThrottled = GuideEngine.shouldThrottleDialogue({
    beat: "celebrate",
    now: 16000,
    lastLineAt: 8000,
    lastBeat: "hint",
    minGapMs: 3000
});
assert.equal(notThrottled, false, "Older beat gap should allow dialogue");

console.log("guide-engine tests passed");
