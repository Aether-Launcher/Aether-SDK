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
export type AetherPermission = 'ui:sidebar' | 'ui:dialogs' | 'instances:list' | 'mods:install' | 'mods:list' | 'mods:delete' | 'mods:toggle' | 'modpacks:install' | 'resourcepacks:install' | 'shaderpacks:install' | 'screenshots:read' | 'screenshots:write' | 'network:http' | 'fs:download' | 'launcher:modloader' | 'discord:presence' | 'skin:export';
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
