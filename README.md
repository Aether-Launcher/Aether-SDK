# Aether SDK (`@aethermc/sdk`)

<p align="center">
  <a href="https://discord.gg/pQc9NnGhpG">
    <img src="https://img.shields.io/badge/discord-Join%20our%20Discord-5865F2?logo=discord&logoColor=white&style=for-the-badge" alt="Discord">
  </a>
  <img src="https://img.shields.io/badge/license-Aether%20Extension%20API%20License-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/version-1.1.0-green?style=for-the-badge" alt="Version">
</p>

The official TypeScript SDK for building extensions for the **Aether Minecraft Launcher**. Provides full type definitions for the `Aether` global API injected by the sandbox runtime, plus helper utilities for safe permission checking, logging, and mod loader registration.

---

## Installation

```bash
npm install --save-dev @aethermc/sdk
```

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

Extensions built with this SDK may be **open-source or closed-source** — your choice. However, **distribution through the Aether Gallery requires review and approval by the Aether team**.

See [LICENSE](LICENSE) for the full terms. Key points:

- ✅ Closed-source extensions are allowed
- ✅ You own your extension's code
- ✅ Aether reviews extensions before Gallery listing (security, quality, policy)
- ❌ You may not use this SDK to build a competing launcher or extension platform
- ❌ You may not distribute extensions outside approved channels without written permission from Aether

To submit your extension for review:  
→ [Aether-Extensions Registry](https://github.com/Aether-Launcher/Aether-Extensions)
