# Protolog

A lightweight, offline-first desktop app for managing laboratory protocols — with version history, step-level comments, reagent tracking, and shareable protocol files.

Your protocols live as plain files on your own machine — no account, no cloud, no institutional licensing required.

!\[Protolog](src/icon.png)

\---

## Why Protolog?

Most working researchers keep their protocols in Word documents, lab notebooks, or scattered PDFs — versions drift between people's laptops and nobody knows whose copy is canonical. Existing tools either require institutional buy-in and cloud accounts, or are built for compliance rather than the person at the bench at 11pm trying to remember what RNase A concentration they used six months ago.

Protolog is for that person. It is:

* **Offline-first** — works on the bench, in the cold room, in the field, with no internet
* **Private** — protocols never leave your machine unless you choose to share them
* **Free** — no subscription, no account, no institutional approval needed
* **Portable** — protocols export as a single file you can email to a colleague

\---

## Features

* **Protocol library** with search, tags, and folders
* **Sections and steps** with descriptions, durations, and per-step reagent lists
* **Step-level comments** — annotate individual steps with dated, attributed notes
* **Immutable version history** — every save is a permanent snapshot you can browse, open, and compare
* **Version locking** — protect important versions (e.g. one tied to a publication) from deletion
* **SHA-256 integrity hashing** — verify a version hasn't been altered outside the app
* **Authorship tracking** — every version records who made it; the full contributor chain travels with the file
* **View / Edit modes** — a clean read-only presentation and a full editor, toggled like Obsidian
* **Export / Import** — share protocols as portable `.json` files; duplicates are detected on import
* **Printing** — print a clean bench sheet or save as PDF, with an option to include or exclude comments

\---

## Installation (for users)

1. Go to the [Releases page](../../releases/latest)
2. Download `Protolog Setup x.x.x.exe`
3. Double-click to install — Protolog appears in your Start menu and on your Desktop

> Windows may show a SmartScreen warning the first time (because the app isn't signed with a paid certificate). Click \*\*More info → Run anyway\*\* to proceed. This is normal for independent software.

All your protocols are stored as `.json` files in `C:\\Users\\<you>\\Protolog\\`. You can back up, sync, or copy this folder freely.

\---

## Building from source (for developers)

Requires [Node.js](https://nodejs.org) (LTS version).

```bash
git clone https://github.com/YOURNAME/protolog.git
cd protolog
npm install
npm start
```

To build a Windows installer:

```bash
npm run build-win
```

The installer is produced in `dist/`.

### Project structure

```
src/
  main.js       Electron main process (file I/O, IPC, hashing)
  preload.js    Secure bridge between main and renderer
  index.html    The entire UI (HTML, CSS, and renderer logic)
  icon.ico      Application icon
package.json    Manifest and build configuration
```

The app is intentionally simple: a single-window Electron app with no build step for the UI. All protocol data is stored as human-readable JSON.

\---

## Sharing protocols

Open a protocol, click **Export**, and send the resulting `.json` file to a colleague. They click **Import**, and it appears in their library — with the full version history, comments, and authorship intact. If they already have a copy, Protolog detects the duplicate and offers to skip, import as a copy, or replace.

\---

## License

Released under the GNU Affero General Public License v3.0. 

\---

## Contributing

Issues and pull requests are welcome. This is an early project and feedback from working scientists is especially valuable.

