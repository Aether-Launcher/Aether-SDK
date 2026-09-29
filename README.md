# Aether SDK (`@aethermc/sdk`)

<p align="center">
    <a href="https://discord.gg/hyPWTs9FfM">
    <img src="https://img.shields.io/badge/discord-Join%20our%20Discord-5865F2?logo=discord&logoColor=white&style=for-the-badge" alt="Discord">
  </a>
  <img src="https://img.shields.io/badge/license-Aether%20Extension%20API%20License-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/version-1.2.0-green?style=for-the-badge" alt="Version">
</p>

The official TypeScript SDK for building extensions for the **Aether Minecraft Launcher**. Provides full type definitions for the `Aether` global API injected by the sandbox runtime — instances, mods, screenshots, servers, worlds, and quick-launch — plus helper utilities for permission checking, logging, mod loader registration, and iframe messaging.

---

## Installation

```bash
npm install --save-dev @aethermc/sdk
```

## What's new in 1.2.0

- Full types for the servers API: `list`, `ping`, `listWithStatus`,
  managed servers (`create`, `listServers`, `delete`, `readFile`,
  `writeFile`), and supervised processes (`start`, `stop`, `status`,
  `send`, `eulaStatus`, `acceptEula`, `recentLogs`).
- Worlds + quick-launch: `listWorlds`, `launchToServer`, `launchToWorld`.
- New `createIframeBridge()` helper for sidebar UI ↔ backend messaging.
- New permissions: `servers:list`, `servers:manage`, `servers:process`,
  `saves:list`, `instances:launch`.

---

## Permissions & Capabilities

Every capability in the API must be declared in your extension's `manifest.json` before it can be used. The sandbox enforces this at the Go level — undeclared capabilities simply won't exist on the `Aether` object.

| Permission | API surface |
|---|---|
| `ui:sidebar` | `Aether.ui.registerSidebarPage`, `onMessage`, `postMessage` |
| `ui:dialogs` | `Aether.ui.openDialog` |
| `instances:list` | `Aether.instances.list` |
| `mods:install` | `Aether.instances.installMod` |
| `mods:list` | `Aether.instances.listMods` |
| `mods:delete` | `Aether.instances.deleteMod` |
| `mods:toggle` | `Aether.instances.toggleMod` |
| `modpacks:install` | `Aether.instances.installModpack` |
| `resourcepacks:install` | `Aether.instances.installResourcePack` |
| `shaderpacks:install` | `Aether.instances.installShaderPack` |
| `screenshots:read` | `Aether.instances.listScreenshots`, `openScreenshot`, `getScreenshotData` |
| `screenshots:write` | `Aether.instances.deleteScreenshot` |
| `network:http` | `Aether.http.get` |
| `fs:download` | `Aether.fs.download` |
| `launcher:modloader` | `Aether.launcher.registerModLoader` |
| `discord:presence` | `Aether.discord.setActivity`, `clearActivity` |
| `skin:export` | `Aether.skins.export` |
| `servers:list` | `Aether.servers.list`, `ping`, `listWithStatus` |
| `servers:manage` | `Aether.servers.create`, `listServers`, `delete`, `readFile`, `writeFile` |
| `servers:process` | `Aether.servers.start`, `stop`, `status`, `send`, `eulaStatus`, `acceptEula`, `recentLogs` |
| `saves:list` | `Aether.instances.listWorlds` |
| `instances:launch` | `Aether.instances.launchToServer`, `launchToWorld` |

---

## Usage

### Basic extension entry point

```typescript
import { onReady, createLogger, assertPermission } from '@aethermc/sdk';

const log = createLogger('my-extension');

onReady(() => {
  log.info('Extension started!');

  assertPermission('ui:sidebar');

  Aether.ui.registerSidebarPage({
    id: 'my-page',
    label: 'My Extension',
    url: 'ui/index.html',
  });
});
```

### Listing instances and installing mods

```typescript
import { onReady, assertPermission } from '@aethermc/sdk';

onReady(() => {
  assertPermission('instances:list');
  assertPermission('mods:install');

  const instances = Aether.instances.list();
  instances.forEach((inst) => {
    console.log(`${inst.name} — ${inst.version} (${inst.loader})`);
  });
});
```

### Registering a mod loader

```typescript
import { onReady, defineProvider } from '@aethermc/sdk';

onReady(() => {
  defineProvider({
    id: 'my-loader',
    name: 'My Loader',
    description: 'A custom mod loader.',
    onLaunch: (ctx) => ({
      jvmArgs: ['-Dmy.loader.enabled=true'],
      mainClass: 'com.example.Main',
    }),
  });
});
```

### Working with screenshots

```typescript
import { onReady, assertPermission } from '@aethermc/sdk';

onReady(() => {
  assertPermission('screenshots:read');

  Aether.ui.onMessage(async (msg: any) => {
    if (msg.type === 'get_screenshots') {
      const screenshots = Aether.instances.listScreenshots(msg.instanceId);
      // Each screenshot has: name, size, modified, url
      // Use `url` directly in <img src="..."> for native rendering
      Aether.ui.postMessage({ type: 'screenshots', data: screenshots });
    }
  });
});
```

### Server lists with live status

```typescript
import { onReady, assertPermission } from '@aethermc/sdk';

onReady(() => {
  assertPermission('servers:list');

  // One bulk call: pings run concurrently in Go and results are cached,
  // so page revisits are instant. Never loop list()+ping() — sequential
  // pings stall for seconds on each dead server.
  const rows = Aether.servers.listWithStatus('my-instance', 3000);
  rows.forEach((s) => {
    console.log(`${s.name} — ${s.online ? `${s.playersOnline}/${s.playersMax}` : 'offline'}`);
  });
});
```

### Quick-launch into servers and worlds

```typescript
import { onReady, assertPermission } from '@aethermc/sdk';

onReady(() => {
  assertPermission('saves:list');
  assertPermission('instances:launch');

  // Singleplayer worlds, most recently played first.
  const worlds = Aether.instances.listWorlds('my-instance');

  // Launch straight into a server (all versions) or a world (1.20+).
  Aether.instances.launchToServer('my-instance', 'play.example.com', 25565);
  Aether.instances.launchToWorld('my-instance', worlds[0].id);
});
```

### UI ↔ backend messaging (iframe bridge)

```typescript
// ui/script.js — runs inside the sidebar iframe:
import { createIframeBridge } from '@aethermc/sdk';

const bridge = createIframeBridge();
const res = await bridge.send<{ servers: unknown[] }>({
  type: 'get_servers',
  instanceId: 'my-instance',
});
```

```typescript
// main.js — runs in the sandbox:
Aether.ui.onMessage((msg: any) => {
  if (msg.type === 'get_servers') {
    const servers = Aether.servers.listWithStatus(msg.instanceId, 3000);
    Aether.ui.postMessage({ type: 'get_servers_result', requestId: msg.requestId, success: true, servers });
  }
  return {};
});
```

The bridge bakes in two rules — do not work around them:

1. `targetOrigin` is `"*"` on purpose. Inside the iframe, `window.location`
   is the iframe's own origin while `window.parent` is the Wails webview —
   a computed origin never matches and every request is silently dropped.
2. Inbound messages match ONLY on `requestId`. Backend payloads are
   forwarded as-is (no marker), so filtering on one drops every reply.

### Discord Rich Presence

```typescript
import { onReady, assertPermission } from '@aethermc/sdk';

onReady(() => {
  assertPermission('discord:presence');

  Aether.events.on('instance:launched', (data: any) => {
    Aether.discord.setActivity({
      details: `Playing ${data.instance.name}`,
      state: data.instance.version,
      startTimestamp: Date.now(),
    });
  });
});
```

---

## manifest.json reference

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "What your extension does.",
  "main": "main.js",
  "api": "1",
  "minLauncherVersion": "v1.0.0",
  "permissions": [
    "ui:sidebar",
    "instances:list",
    "mods:install"
  ],
  "hosts": [
    "https://api.example.com"
  ]
}
```

> **`minLauncherVersion`** — If set, Aether will show an "Incompatible" badge in the Gallery for users on older launcher versions and prevent installation until they update.

---

## Distribution & Licensing

Extensions built with this SDK may be **open-source or closed-source** — your choice. **Distribution through the official Aether Gallery requires review and approval by the Aether team.**

See [LICENSE](LICENSE) for the full terms. Key points:

- 🟢 **Open Source Launcher Forks (GPL-3.0)**: The Aether Launcher itself is 100% open-source under GPL-3.0. Anyone can freely fork the launcher, modify the codebase, or create custom extension APIs/runtimes on their fork.
- ✅ **Closed-Source Extensions Allowed**: Extensions built using this SDK are permitted to be proprietary or closed-source.
- ✅ **Code Ownership**: You retain full ownership of your extension's source code.
- ✅ **Official Gallery Review**: Aether reviews all extensions submitted to the official Gallery for security, safety, and policy compliance.
- ❌ **No Impersonation**: Extensions built with this official SDK (`@aethermc/sdk`) may not be distributed through unapproved third-party channels that impersonate the official Gallery.

To submit your extension for review:  
→ [Aether-Extensions Registry](https://github.com/Aether-Launcher/Aether-Extensions)

