// ─────────────────────────────────────────────────────────────────────────────
// Aether Extension API — Global Type Definitions
// Matches the capability surface exposed by pkg/extensions/sandbox.go
// ─────────────────────────────────────────────────────────────────────────────

/** A minimal view of a Minecraft instance available to extensions. */
export interface InstanceInfo {
  id: string;
  name: string;
  version: string;
  loader: string;
}

/** Metadata returned by Aether.instances.listScreenshots(). */
export interface ScreenshotInfo {
  /** Screenshot filename, e.g. "2024-01-15_12.30.00.png" */
  name: string;
  /** File size in bytes. */
  size: number;
  /** ISO 8601 last-modified timestamp. */
  modified: string;
  /** Direct HTTP URL for native browser image loading via the local extension server. */
  url: string;
}

/** Options accepted by Aether.discord.setActivity(). */
export interface DiscordActivity {
  details?: string;
  state?: string;
  largeImageKey?: string;
  largeText?: string;
  smallImageKey?: string;
  smallText?: string;
  /** Unix timestamp in milliseconds. */
  startTimestamp?: number;
}

/** Spec object passed to Aether.launcher.registerModLoader(). */
export interface ModLoaderSpec {
  id: string;
  name: string;
  description?: string;
  onLaunch: (ctx: ModLoaderContext) => ModLoaderResult;
}

/** Context passed to an extension's onLaunch callback when a user launches a
 *  Minecraft instance using the registered mod loader. */
export interface ModLoaderContext {
  /** The instance that is being launched. */
  instance: InstanceInfo;
  /** Arbitrary extra context provided by the launcher (e.g. Java path). */
  [key: string]: unknown;
}

/** Values your onLaunch callback must return to configure the launch. */
export interface ModLoaderResult {
  /** Additional JVM arguments (e.g. "-Dfml.ignoreInvalidMinecraftCertificates=true"). */
  jvmArgs?: string[];
  /** Additional game arguments. */
  gameArgs?: string[];
  /** Extra classpath entries (absolute paths). */
  classpath?: string[];
  /** Main class override. */
  mainClass?: string;
  /** Arbitrary extra keys forwarded to the launcher. */
  [key: string]: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// AetherAPI — the shape of the `Aether` global injected by the sandbox
// ─────────────────────────────────────────────────────────────────────────────

export interface AetherUI {
  /**
   * Register a sidebar navigation page for this extension.
   * Requires permission: `ui:sidebar`
   */
  registerSidebarPage(opts: { id: string; label: string; url: string }): void;

  /**
   * Open a built-in Aether dialog.
   * Requires permission: `ui:dialogs`
   */
  openDialog(opts: Record<string, unknown>): void;

  /**
   * Register a handler to receive messages from the extension's UI iframe.
   * Requires permission: `ui:sidebar`
   */
  onMessage(callback: (payload: unknown) => unknown): void;

  /**
   * Broadcast a message to the extension's UI iframe.
   * Requires permission: `ui:sidebar`
   */
  postMessage(payload: unknown): void;
}

export interface AetherInstances {
  /**
   * List all Minecraft instances.
   * Requires permission: `instances:list`
   */
  list(): InstanceInfo[];

  /**
   * Install a mod jar into an instance.
   * Requires permission: `mods:install`
   */
  installMod(instanceId: string, jarName: string, downloadURL: string): string;

  /**
   * List mod jars installed in an instance.
   * Requires permission: `mods:list`
   */
  listMods(instanceId: string): string[];

  /**
   * Delete a mod jar from an instance.
   * Requires permission: `mods:delete`
   */
  deleteMod(instanceId: string, jarName: string): void;

  /**
   * Enable or disable a mod jar in an instance.
   * Requires permission: `mods:toggle`
   */
  toggleMod(instanceId: string, jarName: string, enable: boolean): void;

  /**
   * Download and install a modpack (.mrpack) as a new instance.
   * Requires permission: `modpacks:install`
   */
  installModpack(packURL: string, packName: string): string;

  /**
   * Install a resource pack into an instance.
   * Requires permission: `resourcepacks:install`
   */
  installResourcePack(instanceId: string, fileName: string, downloadURL: string): string;

  /**
   * Install a shader pack into an instance.
   * Requires permission: `shaderpacks:install`
   */
  installShaderPack(instanceId: string, fileName: string, downloadURL: string): string;

  /**
   * List screenshots for an instance.
   * Requires permission: `screenshots:read`
   */
  listScreenshots(instanceId: string): ScreenshotInfo[];

  /**
   * Delete a screenshot from an instance.
   * Requires permission: `screenshots:write`
   */
  deleteScreenshot(instanceId: string, fileName: string): void;

  /**
   * Open a screenshot in the OS default image viewer.
   * Requires permission: `screenshots:read`
   */
  openScreenshot(instanceId: string, fileName: string): void;

  /**
   * Get the raw base64-encoded image data for a screenshot.
   * Prefer using the `url` field from `listScreenshots()` for UI rendering.
   * Requires permission: `screenshots:read`
   */
  getScreenshotData(instanceId: string, fileName: string): string;
}

export interface AetherHTTP {
  /**
   * Perform a GET request to an allowlisted HTTPS host.
   * Requires permission: `network:http`
   * Hosts must be declared in the manifest `hosts` field.
   */
  get(url: string): string;
}

export interface AetherFS {
  /**
   * Download a file from an allowlisted HTTPS URL to the launcher's libraries folder.
   * Requires permission: `fs:download`
   */
  download(url: string, destPath: string): string;
}

export interface AetherLauncher {
  /**
   * Register a custom mod loader with the launcher.
   * Requires permission: `launcher:modloader`
   */
  registerModLoader(spec: ModLoaderSpec): void;
}

export interface AetherDiscord {
  /**
   * Set a Discord Rich Presence activity.
   * Requires permission: `discord:presence`
   */
  setActivity(activity: DiscordActivity): void;

  /**
   * Clear the current Discord Rich Presence activity.
   * Requires permission: `discord:presence`
   */
  clearActivity(): void;
}

export interface AetherEvents {
  /**
   * Subscribe to a launcher event.
   * Requires permission: `discord:presence` or `instances:list`
   *
   * @example
   * Aether.events.on('instance:launched', (data) => { ... });
   */
  on(event: string, callback: (data: unknown) => void): void;

  /**
   * Unsubscribe all handlers for a launcher event.
   */
  off(event: string): void;
}

export interface AetherSkins {
  /**
   * Export a base64-encoded PNG as a skin file to the launcher's skins folder.
   * Requires permission: `skin:export`
   * @returns Absolute path of the saved skin file.
   */
  export(base64Data: string, filename?: string): string;
}

/** The full Aether API object injected into every extension sandbox. */
export interface AetherAPI {
  /** UI registration and IPC. Available with `ui:sidebar` / `ui:dialogs`. */
  ui: AetherUI;
  /** Instance, mod, screenshot, and pack management. */
  instances: AetherInstances;
  /** HTTP client gated by the manifest host allowlist. */
  http: AetherHTTP;
  /** File download utility. */
  fs: AetherFS;
  /** Mod loader registration. */
  launcher: AetherLauncher;
  /** Discord Rich Presence control. */
  discord: AetherDiscord;
  /** Launcher event bus. */
  events: AetherEvents;
  /** Skin export utility. */
  skins: AetherSkins;
}

declare global {
  /** The Aether API object injected by the sandbox runtime. Only the
   *  capabilities permitted by the extension's manifest are available. */
  const Aether: AetherAPI;
}
