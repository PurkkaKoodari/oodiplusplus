[Suomeksi](README.md)

# Oodi++

Oodi++ is a [userscript][userscript] for WebOodi. It adds a powerful schedule view that allows you to pick lectures and other
events and follow your schedule filling up in real time.

Potential future features:

- Exporting completes schedules to calendar apps in ICAL format
- Printing completed schedules
- Synchronizing course selections: edit selections on all your devices and they'll also automatically update in calendar apps

## Installation

To use Oodi++ you need a userscript manager like Tampermonkey. Install it first for [Firefox][tm-ff] or [Chrome][tm-chrome].

Then download the userscript itself. It's available in three editions:

- [Auto-update edition](oodiplusplus.autoupdate.user.js) auto-updates via Tampermonkey.
- [Auto-check edition](oodiplusplus.autocheck.user.js) automatically checks for updates, but doesn't execute code from the
  internet. Choose this option if you want to read through the code and make sure no changes are made without you noticing.
- [Tinfoil hat edition](oodiplusplus.folio.user.js) makes no network requests. Because someone was always going to ask for this.

## Building

The original source code is available on [GitLab][gitlab]. The build process uses Webpack and TypeScript, but the configuration
intends to maximize the readability of the result.

To build the userscripts just run `npm install` and `make` (requires a normal *nix environment and a relatively fresh Node.js).

[userscript]: https://en.wikipedia.org/wiki/Userscript
[tm-ff]: https://addons.mozilla.org/fi/firefox/addon/tampermonkey/
[tm-chrome]: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
[gitlab]: https://gitlab.com/PurkkaKoodari/oodiplusplus
