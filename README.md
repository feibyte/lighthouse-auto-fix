# lighthouse-auto-fix(WIP)
> 🚀 Automatically resolve lighthouse issues, especially for static website.

## Quick Overview

```sh
npm install -g lighthouse-auto-fix
lighthouse-auto-fix <Your Url>
```
Then you could find optimized files in `dist`.

### CLI Options
```
$ lighthouse-auto-fix --help
lighthouse-auto-fix <url>

Options:
  --version      Show version number                                   [boolean]
  --out-dir, -d  set the output directory. defaults to "dist"  [default: "dist"]
  --device                   [choices: "mobile", "desktop"] [default: "desktop"]
  --help         Show help                                             [boolean]
```

## Supported Optimization

Not all audit items are able to fix by automated tool. Here's the list what we manage to fix [Supported Items](/docs/supported-audit-items.md) 
