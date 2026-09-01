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
  | 'skin:export';

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
