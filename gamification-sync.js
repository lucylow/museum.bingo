/**
 * Sync service shim for demo mode.
 * Mirrors Socket.IO + Firestore behavior through localStorage and browser events.
 */

const ROOM_STORAGE_KEY = "museumBingoRoomScores";
const EVENT_STORAGE_KEY = "museumBingoScanEvents";
const PRESENCE_TIMEOUT_MS = 120000;

function safeParse(json, fallback) {
    try {
        return JSON.parse(json);
    } catch (err) {
        console.warn("Failed to parse storage payload:", err);
        return fallback;
    }
}

function readRoomState() {
    return safeParse(localStorage.getItem(ROOM_STORAGE_KEY) || "{}", {});
}

function writeRoomState(state) {
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(state));
}

function readEvents() {
    return safeParse(localStorage.getItem(EVENT_STORAGE_KEY) || "[]", []);
}

function writeEvents(events) {
    localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events.slice(0, 400)));
}

function persistEvent(eventPayload) {
    const current = readEvents();
    current.unshift(eventPayload);
    writeEvents(current);
}

function updateRoomEntry(roomId, entry) {
    const state = readRoomState();
    if (!state[roomId]) state[roomId] = {};
    Object.keys(state[roomId]).forEach((userId) => {
        const updatedAt = Date.parse(state[roomId][userId] && state[roomId][userId].updatedAt || "");
        if (Number.isFinite(updatedAt) && (Date.now() - updatedAt) > PRESENCE_TIMEOUT_MS) {
            delete state[roomId][userId];
        }
    });
    state[roomId][entry.userId] = {
        ...entry,
        isOnline: true,
        updatedAt: new Date().toISOString()
    };
    writeRoomState(state);
    window.dispatchEvent(new CustomEvent("museum-bingo-room-update", {
        detail: {
            roomId,
            entries: Object.values(state[roomId])
        }
    }));
    return Object.values(state[roomId]);
}

function getRoomEntries(roomId) {
    const state = readRoomState();
    return Object.values(state[roomId] || {});
}

function createGamificationSyncService({ roomId }) {
    return {
        roomId,
        persistEvent,
        getRecentEvents: () => readEvents().slice(0, 40),
        updateRoomEntry: (entry) => updateRoomEntry(roomId, entry),
        getRoomEntries: () => getRoomEntries(roomId),
        subscribeToRoomUpdates: (callback) => {
            if (typeof callback !== "function") return () => {};
            const handler = (event) => {
                if (!event || !event.detail || event.detail.roomId !== roomId) return;
                callback(event.detail.entries);
            };
            window.addEventListener("museum-bingo-room-update", handler);
            return () => window.removeEventListener("museum-bingo-room-update", handler);
        }
    };
}

window.GamificationSync = {
    createGamificationSyncService,
    ROOM_STORAGE_KEY,
    EVENT_STORAGE_KEY
};
