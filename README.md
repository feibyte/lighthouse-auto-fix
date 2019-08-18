# lighthouse-auto-fix [![Build Status](https://travis-ci.com/fedeoo/lighthouse-auto-fix.svg?branch=master)](https://travis-ci.com/fedeoo/lighthouse-auto-fix) [![Coveralls](https://img.shields.io/coveralls/fedeoo/lighthouse-auto-fix.svg)](https://coveralls.io/github/fedeoo/lighthouse-auto-fix) [![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](https://github.com/fedeoo/lighthouse-auto-fix/pulls)
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
This repo aims to optimize website based on lighthouse. 
Not all audit items are able to fix by automated tool. Here's the list what we manage to fix [Supported Items](/docs/supported-audit-items.md) 
