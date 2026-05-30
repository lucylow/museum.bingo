const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadGamificationModules() {
    const sandbox = {
        window: {},
        console,
        Date,
        Math,
        setTimeout,
        clearTimeout
    };
    sandbox.window.window = sandbox.window;
    vm.createContext(sandbox);

    const rulesCode = fs.readFileSync(path.join(__dirname, "..", "bingo-rules.js"), "utf8");
    vm.runInContext(rulesCode, sandbox);

    const engineCode = fs.readFileSync(path.join(__dirname, "..", "gamification-engine.js"), "utf8");
    vm.runInContext(engineCode, sandbox);

    return {
        createGamificationEngine: sandbox.window.GamificationEngine.createGamificationEngine
    };
}

function run() {
    const { createGamificationEngine } = loadGamificationModules();
    const engine = createGamificationEngine({
        userId: "player_1",
        roomId: "ROOM42",
        seasonId: "spring_2026",
        gridSize: 3,
        dailyChallengeEnabled: true
    });

    const first = engine.onTileValidated({ tileId: 1, scanDurationMs: 5000 });
    assert.equal(first.accepted, true, "First tile should validate");
    assert.ok(first.unlockedTokens.some((token) => token.id === "nft_first_scan"), "First scan token should unlock");

    engine.onTileValidated({ tileId: 2, scanDurationMs: 6000 });
    const line = engine.onTileValidated({ tileId: 3, scanDurationMs: 6000 });
    assert.ok(line.unlockedTokens.some((token) => token.id === "nft_line_unlock"), "Line token should unlock");

    [4, 5, 6, 7, 8, 9].forEach((tileId) => {
        engine.onTileValidated({ tileId, scanDurationMs: 7000 });
    });

    const snapshotAfterCard = engine.getStateSnapshot();
    assert.equal(snapshotAfterCard.hasFullCard, true, "Full card should be complete");
    assert.ok(snapshotAfterCard.nftTokens.some((token) => token.id === "nft_full_card_relic"), "Full card token should unlock");
    assert.ok(snapshotAfterCard.nftTokens.some((token) => token.id === "nft_daily_spring_2026"), "Seasonal daily token should unlock");

    engine.applyLeaderboard([engine.getRoomEntry()]);
    const snapshotAfterLeaderboard = engine.getStateSnapshot();
    assert.ok(snapshotAfterLeaderboard.nftTokens.some((token) => token.id === "nft_room_trophy"), "Room trophy token should unlock for rank #1");

    const mintResult = engine.requestTokenMint({
        tokenId: "nft_full_card_relic",
        walletAddress: "0x1234"
    });
    assert.equal(mintResult.accepted, true, "Optional minting should succeed for unlocked token");
    assert.equal(mintResult.token.minted, true, "Minted token should be marked minted");

    console.log("nft-gamification tests passed");
}

run();
