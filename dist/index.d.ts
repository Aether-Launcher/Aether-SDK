export * from './global';
/**
 * Run a callback once the Aether sandbox is fully initialised.
 *
 * @example
 * import { onReady } from '@aethermc/sdk';
 * onReady(() => {
 *   Aether.ui.registerSidebarPage({ id: 'my-page', label: 'My Page', url: 'ui/index.html' });
 * });
 */
export declare function onReady(fn: () => void): void;
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
export declare function createLogger(name: string): Logger;
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
export declare function defineProvider(spec: ModLoaderSpec): void;
/** All permission strings recognised by the Aether sandbox. */
export type AetherPermission = 'ui:sidebar' | 'ui:dialogs' | 'instances:list' | 'mods:install' | 'mods:list' | 'mods:delete' | 'mods:toggle' | 'modpacks:install' | 'resourcepacks:install' | 'shaderpacks:install' | 'screenshots:read' | 'screenshots:write' | 'network:http' | 'fs:download' | 'launcher:modloader' | 'discord:presence' | 'skin:export' | 'servers:list' | 'servers:manage' | 'servers:process' | 'saves:list' | 'instances:launch';
/**
 * Assert that a permission was granted and the corresponding API is available.
 * Throws a descriptive error if the permission is missing, making it easy to
 * surface misconfigurations at startup rather than deep in your extension logic.
 *
 * @example
 * assertPermission('mods:install');
 * Aether.instances.installMod(instanceId, jarName, url);
 */
export declare function assertPermission(permission: AetherPermission): void;
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
export declare function createIframeBridge(defaultTimeoutMs?: number): IframeBridge;
