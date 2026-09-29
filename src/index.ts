export * from './global';

// ─────────────────────────────────────────────────────────────────────────────
// onReady — safe entry point for extension scripts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a callback once the Aether sandbox is fully initialised.
 *
 * @example
 * import { onReady } from '@aethermc/sdk';
 * onReady(() => {
 *   Aether.ui.registerSidebarPage({ id: 'my-page', label: 'My Page', url: 'ui/index.html' });
 * });
 */
export function onReady(fn: () => void): void {
  if (typeof setTimeout !== 'undefined') {
    setTimeout(fn, 0);
  } else {
    fn();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createLogger — namespaced console logger
// ─────────────────────────────────────────────────────────────────────────────

export interface Logger {
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

/**
 * Create a simple namespaced logger that prefixes all output with the given name.
 *
 * @example
 * const log = createLogger('my-extension');
 * log.info('Extension started!');
 */
export function createLogger(name: string): Logger {
  return {
    info:  (...args) => console.log(`[INFO]  [${name}]`, ...args),
    warn:  (...args) => console.warn(`[WARN]  [${name}]`, ...args),
    error: (...args) => console.error(`[ERROR] [${name}]`, ...args),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// defineProvider — type-safe mod loader registration
// ─────────────────────────────────────────────────────────────────────────────

import type { ModLoaderSpec } from './global';

/**
 * Register a custom mod loader with Aether.
 * A convenience wrapper around `Aether.launcher.registerModLoader()` with
 * validation and a clear error message if the required permission is missing.
 *
 * Requires manifest permission: `launcher:modloader`
 *
 * @example
 * import { onReady, defineProvider } from '@aethermc/sdk';
 * onReady(() => {
 *   defineProvider({
 *     id: 'my-loader',
 *     name: 'My Loader',
 *     description: 'A custom mod loader.',
 *     onLaunch: (ctx) => ({ jvmArgs: ['-Dmy.flag=true'] }),
 *   });
 * });
 */
export function defineProvider(spec: ModLoaderSpec): void {
  if (!Aether?.launcher?.registerModLoader) {
    throw new Error(
      "Aether.launcher is not available. " +
      "Add \"launcher:modloader\" to your manifest.json permissions."
    );
  }
  if (!spec.id || !spec.name || typeof spec.onLaunch !== 'function') {
    throw new Error("defineProvider: spec must include 'id', 'name', and 'onLaunch'.");
  }
  Aether.launcher.registerModLoader(spec);
}

// ─────────────────────────────────────────────────────────────────────────────
// assertPermission — runtime capability assertion
// ─────────────────────────────────────────────────────────────────────────────

/** All permission strings recognised by the Aether sandbox. */
export type AetherPermission =
  | 'ui:sidebar'
  | 'ui:dialogs'
  | 'instances:list'
  | 'mods:install'
  | 'mods:list'
  | 'mods:delete'
  | 'mods:toggle'
  | 'modpacks:install'
  | 'resourcepacks:install'
  | 'shaderpacks:install'
  | 'screenshots:read'
  | 'screenshots:write'
  | 'network:http'
  | 'fs:download'
  | 'launcher:modloader'
  | 'discord:presence'
  | 'skin:export'
  | 'servers:list'
  | 'servers:manage'
  | 'servers:process'
  | 'saves:list'
  | 'instances:launch';

/** Maps each permission to a function that detects whether the API is live. */
const permissionProbes: Partial<Record<AetherPermission, () => boolean>> = {
  'ui:sidebar':            () => !!(Aether?.ui?.registerSidebarPage),
  'ui:dialogs':            () => !!(Aether?.ui?.openDialog),
  'instances:list':        () => !!(Aether?.instances?.list),
  'mods:install':          () => !!(Aether?.instances?.installMod),
  'mods:list':             () => !!(Aether?.instances?.listMods),
  'mods:delete':           () => !!(Aether?.instances?.deleteMod),
  'mods:toggle':           () => !!(Aether?.instances?.toggleMod),
  'modpacks:install':      () => !!(Aether?.instances?.installModpack),
  'resourcepacks:install': () => !!(Aether?.instances?.installResourcePack),
  'shaderpacks:install':   () => !!(Aether?.instances?.installShaderPack),
  'screenshots:read':      () => !!(Aether?.instances?.listScreenshots),
  'screenshots:write':     () => !!(Aether?.instances?.deleteScreenshot),
  'network:http':          () => !!(Aether?.http?.get),
  'fs:download':           () => !!(Aether?.fs?.download),
  'launcher:modloader':    () => !!(Aether?.launcher?.registerModLoader),
  'discord:presence':      () => !!(Aether?.discord?.setActivity),
  'skin:export':           () => !!(Aether?.skins?.export),
  'servers:list':          () => !!(Aether?.servers?.listWithStatus),
  'servers:manage':        () => !!(Aether?.servers?.create),
  'servers:process':       () => !!(Aether?.servers?.start),
  'saves:list':            () => !!(Aether?.instances?.listWorlds),
  'instances:launch':      () => !!(Aether?.instances?.launchToServer),
};

/**
 * Assert that a permission was granted and the corresponding API is available.
 * Throws a descriptive error if the permission is missing, making it easy to
 * surface misconfigurations at startup rather than deep in your extension logic.
 *
 * @example
 * assertPermission('mods:install');
 * Aether.instances.installMod(instanceId, jarName, url);
 */
export function assertPermission(permission: AetherPermission): void {
  const probe = permissionProbes[permission];
  if (probe && !probe()) {
    throw new Error(
      `Permission '${permission}' is not available. ` +
      `Add it to the permissions array in your manifest.json.`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createIframeBridge — request/response IPC for extension UIs
// ─────────────────────────────────────────────────────────────────────────────

/** Envelope for UI → main.js requests. `requestId` is assigned by the bridge. */
export interface BridgeRequest {
  type: string;
  requestId?: number;
  [key: string]: unknown;
}

/** Envelope for main.js → UI responses. */
export interface BridgeResponse {
  type?: string;
  requestId?: number;
  success?: boolean;
  error?: string;
  [key: string]: unknown;
}

export interface IframeBridge {
  /**
   * Send a request to main.js and resolve with its response.
   * Rejects on `success: false`/`error`, or with `Request timed out`.
   */
  send<T extends BridgeResponse>(payload: BridgeRequest, timeoutMs?: number): Promise<T>;
}

/**
 * Create a request/response bridge between an extension UI iframe and its
 * backend script (`Aether.ui.onMessage`). Handles `requestId` correlation
 * and timeouts so every UI only writes its message handlers.
 *
 * Two rules are baked in — both learned from real timeout bugs, do not
 * work around them:
 *
 * 1. `targetOrigin` is `"*"` on purpose. Inside the iframe,
 *    `window.location` is the iframe's own origin
 *    (`http://127.0.0.1:port`) while `window.parent` is the Wails webview
 *    (`wails://…`) — a computed origin never matches, so `postMessage`
 *    silently drops every request. Correlation via `requestId` is the
 *    actual security boundary.
 * 2. Inbound messages are matched ONLY on `requestId`. The launcher
 *    forwards backend payloads as-is (no marker), so filtering on one
 *    drops every reply.
 *
 * Requires manifest permission: `ui:sidebar`
 *
 * @example
 * import { createIframeBridge } from '@aethermc/sdk';
 * const bridge = createIframeBridge();
 * const res = await bridge.send<{ servers: unknown[] }>({
 *   type: 'get_servers', instanceId: 'my-instance',
 * });
 */
export function createIframeBridge(defaultTimeoutMs = 15000): IframeBridge {
  const pending = new Map<number, { resolve: (v: never) => void; reject: (e: Error) => void }>();
  let reqCounter = 0;

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('message', (e: MessageEvent) => {
      const msg = e.data as BridgeResponse | null | undefined;
      // No marker check: backend responses carry none (see rule 2 above).
      if (!msg || msg.requestId == null) return;
      const p = pending.get(msg.requestId);
      if (!p) return;
      pending.delete(msg.requestId);
      if (msg.error || msg.success === false) p.reject(new Error(msg.error || 'failed'));
      else p.resolve(msg as never);
    });
  }

  return {
    send<T extends BridgeResponse>(payload: BridgeRequest, timeoutMs?: number): Promise<T> {
      const ms = timeoutMs ?? defaultTimeoutMs;
      return new Promise<T>((resolve, reject) => {
        const id = ++reqCounter;
        payload.requestId = id;
        pending.set(id, { resolve: resolve as (v: never) => void, reject });
        // "*" is correct here (see rule 1 above).
        window.parent.postMessage(payload, '*');
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error('Request timed out'));
          }
        }, ms);
      });
    },
  };
}
