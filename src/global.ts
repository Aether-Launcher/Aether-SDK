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

/** One singleplayer world, as returned by Aether.instances.listWorlds(). */
export interface WorldInfo {
  /** Saves folder name — pass this to launchToWorld(). */
  id: string;
  /** Display name from level.dat (falls back to the folder name). */
  name: string;
  /** Last-played timestamp in milliseconds since epoch (0 if unknown). */
  lastPlayed: number;
  /** Survival=0, Creative=1, Adventure=2, Spectator=3. */
  gameMode: number;
}

/** One entry from an instance's servers.dat, via Aether.servers.list(). */
export interface ServerEntry {
  name: string;
  ip: string;
  hidden?: boolean;
  hasIcon?: boolean;
}

/** Live ping result, via Aether.servers.ping(). */
export interface PingResult {
  online: boolean;
  host: string;
  port: number;
  motd?: string;
  playersOnline?: number;
  playersMax?: number;
  version?: string;
  protocol?: number;
  latencyMs?: number;
}

/**
 * One servers.dat entry with its live status attached, via
 * Aether.servers.listWithStatus(). Pings run concurrently in Go with a
 * per-server budget and results are cached — prefer this over
 * list()+ping() loops, which stall for seconds on each dead server.
 */
export interface ServerRow extends ServerEntry {
  online: boolean;
  /** Parsed host (ping echoes it even when offline). */
  host: string;
  /** Parsed port (default 25565). */
  port: number;
  motd?: string;
  playersOnline?: number;
  playersMax?: number;
  version?: string;
  latencyMs?: number;
}

/** One extension-managed server directory, via Aether.servers.listServers(). */
export interface ManagedServer {
  id: string;
  name: string;
}

/** Supervised server process state, via start()/status(). */
export interface ServerProcessStatus {
  id: string;
  running: boolean;
  pid?: number;
  startedAt?: number;
  port?: number;
  mcVersion?: string;
}

/** Options for Aether.servers.start(). Zero values get sane defaults. */
export interface ServerStartOptions {
  mcVersion?: string;
  /** RAM in MiB (default 2048, clamped 512–16384). */
  memoryMB?: number;
  /** Jar filename override (default auto-detect: paper-*, purpur-*, server.jar). */
  jarName?: string;
  extraArgs?: string[];
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

  /**
   * List singleplayer worlds from an instance's `saves/` folder, most
   * recently played first. Names come from `level.dat`.
   * Requires permission: `saves:list`
   */
  listWorlds(instanceId: string): WorldInfo[];

  /**
   * Launch the game and auto-connect to a multiplayer server
   * (vanilla `--server`/`--port`, all versions).
   * Requires permission: `instances:launch`
   */
  launchToServer(instanceId: string, host: string, port: number): void;

  /**
   * Launch the game and auto-load a singleplayer world
   * (Mojang Quick Play — requires Minecraft 1.20+).
   * Requires permission: `instances:launch`
   */
  launchToWorld(instanceId: string, world: string): void;
}

export interface AetherServers {
  /**
   * Read an instance's `servers.dat` entries (no ping).
   * Requires permission: `servers:list`
   */
  list(instanceId: string): ServerEntry[];

  /**
   * Ping one server. Unreachable servers yield `{ online: false }`,
   * not an error — only malformed input throws.
   * Requires permission: `servers:list`
   */
  ping(hostport: string): PingResult;

  /**
   * Bulk list with live status: entries plus ping results in one call.
   * Pings run concurrently (max 6) with a per-server budget in
   * milliseconds (default 3000, clamped 500–10000); results are cached
   * per `servers.dat` content, so revisits are instant.
   * Requires permission: `servers:list`
   */
  listWithStatus(instanceId: string, timeoutMs?: number): ServerRow[];

  /**
   * Create an extension-managed server directory with a starter
   * `server.properties`.
   * Requires permission: `servers:manage`
   */
  create(id: string, name?: string): ManagedServer;

  /**
   * List every extension-managed server directory.
   * Requires permission: `servers:manage`
   */
  listServers(): ManagedServer[];

  /**
   * Delete a managed server directory (fires the launcher confirmation
   * dialog; denial throws `user denied server deletion`).
   * Requires permission: `servers:manage`
   */
  delete(id: string): void;

  /**
   * Read a text file inside a managed server directory (5 MiB cap).
   * Requires permission: `servers:manage`
   */
  readFile(id: string, relpath: string): string;

  /**
   * Write base64 content inside a managed server directory
   * (5 MiB cap, atomic write).
   * Requires permission: `servers:manage`
   */
  writeFile(id: string, relpath: string, base64Data: string): void;

  /**
   * Start a supervised server process. Fails with an EULA error when
   * `eula.txt` is not accepted — confirm with the user, call
   * `acceptEula`, and retry. Max 2 concurrent servers.
   * Requires permission: `servers:process`
   */
  start(id: string, opts?: ServerStartOptions): ServerProcessStatus;

  /**
   * Graceful `stop` (killed after 10 s).
   * Requires permission: `servers:process`
   */
  stop(id: string): void;

  /**
   * Query a supervised server process.
   * Requires permission: `servers:process`
   */
  status(id: string): ServerProcessStatus;

  /**
   * Write a console line to a running server's stdin (4 KB cap).
   * Requires permission: `servers:process`
   */
  send(id: string, command: string): void;

  /**
   * Whether the managed server's `eula.txt` accepts the EULA.
   * Requires permission: `servers:process`
   */
  eulaStatus(id: string): boolean;

  /**
   * Write `eula=true`. Call ONLY after explicit user confirmation.
   * Requires permission: `servers:process`
   */
  acceptEula(id: string): void;

  /**
   * Last buffered log lines for a server, newest last (default 100).
   * Requires permission: `servers:process`
   */
  recentLogs(id: string, n?: number): string[];
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
  /** Instance, mod, screenshot, pack, world, and launch management. */
  instances: AetherInstances;
  /** Multiplayer server lists, managed servers, and server processes. */
  servers: AetherServers;
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
