// src/index.ts
function onReady(fn) {
  if (typeof setTimeout !== "undefined") {
    setTimeout(fn, 0);
  } else {
    fn();
  }
}
function createLogger(name) {
  return {
    info: (...args) => console.log(`[INFO]  [${name}]`, ...args),
    warn: (...args) => console.warn(`[WARN]  [${name}]`, ...args),
    error: (...args) => console.error(`[ERROR] [${name}]`, ...args)
  };
}
function defineProvider(spec) {
  if (!Aether?.launcher?.registerModLoader) {
    throw new Error(
      'Aether.launcher is not available. Add "launcher:modloader" to your manifest.json permissions.'
    );
  }
  if (!spec.id || !spec.name || typeof spec.onLaunch !== "function") {
    throw new Error("defineProvider: spec must include 'id', 'name', and 'onLaunch'.");
  }
  Aether.launcher.registerModLoader(spec);
}
var permissionProbes = {
  "ui:sidebar": () => !!Aether?.ui?.registerSidebarPage,
  "ui:dialogs": () => !!Aether?.ui?.openDialog,
  "instances:list": () => !!Aether?.instances?.list,
  "mods:install": () => !!Aether?.instances?.installMod,
  "mods:list": () => !!Aether?.instances?.listMods,
  "mods:delete": () => !!Aether?.instances?.deleteMod,
  "mods:toggle": () => !!Aether?.instances?.toggleMod,
  "modpacks:install": () => !!Aether?.instances?.installModpack,
  "resourcepacks:install": () => !!Aether?.instances?.installResourcePack,
  "shaderpacks:install": () => !!Aether?.instances?.installShaderPack,
  "screenshots:read": () => !!Aether?.instances?.listScreenshots,
  "screenshots:write": () => !!Aether?.instances?.deleteScreenshot,
  "network:http": () => !!Aether?.http?.get,
  "fs:download": () => !!Aether?.fs?.download,
  "launcher:modloader": () => !!Aether?.launcher?.registerModLoader,
  "discord:presence": () => !!Aether?.discord?.setActivity,
  "skin:export": () => !!Aether?.skins?.export
};
function assertPermission(permission) {
  const probe = permissionProbes[permission];
  if (probe && !probe()) {
    throw new Error(
      `Permission '${permission}' is not available. Add it to the permissions array in your manifest.json.`
    );
  }
}
export {
  assertPermission,
  createLogger,
  defineProvider,
  onReady
};
//# sourceMappingURL=index.mjs.map