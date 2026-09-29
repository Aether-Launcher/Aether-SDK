"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  assertPermission: () => assertPermission,
  createIframeBridge: () => createIframeBridge,
  createLogger: () => createLogger,
  defineProvider: () => defineProvider,
  onReady: () => onReady
});
module.exports = __toCommonJS(index_exports);
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
  "skin:export": () => !!Aether?.skins?.export,
  "servers:list": () => !!Aether?.servers?.listWithStatus,
  "servers:manage": () => !!Aether?.servers?.create,
  "servers:process": () => !!Aether?.servers?.start,
  "saves:list": () => !!Aether?.instances?.listWorlds,
  "instances:launch": () => !!Aether?.instances?.launchToServer
};
function assertPermission(permission) {
  const probe = permissionProbes[permission];
  if (probe && !probe()) {
    throw new Error(
      `Permission '${permission}' is not available. Add it to the permissions array in your manifest.json.`
    );
  }
}
function createIframeBridge(defaultTimeoutMs = 15e3) {
  const pending = /* @__PURE__ */ new Map();
  let reqCounter = 0;
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("message", (e) => {
      const msg = e.data;
      if (!msg || msg.requestId == null) return;
      const p = pending.get(msg.requestId);
      if (!p) return;
      pending.delete(msg.requestId);
      if (msg.error || msg.success === false) p.reject(new Error(msg.error || "failed"));
      else p.resolve(msg);
    });
  }
  return {
    send(payload, timeoutMs) {
      const ms = timeoutMs ?? defaultTimeoutMs;
      return new Promise((resolve, reject) => {
        const id = ++reqCounter;
        payload.requestId = id;
        pending.set(id, { resolve, reject });
        window.parent.postMessage(payload, "*");
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error("Request timed out"));
          }
        }, ms);
      });
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assertPermission,
  createIframeBridge,
  createLogger,
  defineProvider,
  onReady
});
//# sourceMappingURL=index.js.map