const fs = require("fs");
const path = require("path");
const vm = require("vm");

function createSandbox() {
    const store = new Map();
    const sandbox = {
        window: {},
        localStorage: {
            getItem: (key) => (store.has(key) ? store.get(key) : null),
            setItem: (key, value) => store.set(key, String(value))
        },
        document: {
            documentElement: {
                setAttribute: () => {}
            }
        },
        console
    };
    sandbox.window.window = sandbox.window;
    return sandbox;
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function loadI18n() {
    const file = path.join(__dirname, "..", "src", "localization", "i18n.js");
    const code = fs.readFileSync(file, "utf8");
    const sandbox = createSandbox();
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.I18n;
}

function run() {
    const i18n = loadI18n();
    assert(Boolean(i18n), "I18n global should be available");

    i18n.setLocale("es");
    assert(i18n.getLocale() === "es", "Locale should switch to es");
    assert(i18n.t("scan.scanning") === "Escaneando", "Spanish lookup should return translated string");

    i18n.setLocale("ar");
    assert(i18n.getDirection() === "rtl", "Arabic should be RTL");

    i18n.setLocale("ru");
    assert(i18n.t("scan.scanning") === "Scanning", "Missing locale should fallback to English");

    const one = i18n.t("stats.tiles", { count: 1 });
    const many = i18n.t("stats.tiles", { count: 3 });
    assert(one.includes("tile"), "Pluralization one should use singular form");
    assert(many.includes("tiles"), "Pluralization many should use plural form");

    console.log("Localization tests passed.");
}

run();
