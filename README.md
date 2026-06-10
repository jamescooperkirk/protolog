# protolog
Protolog: a desktop app for creating and tracking protocols. Made for scientists. 
Protolog — Lab Protocol Manager
A desktop app for managing lab protocols with versioning, step-level comments, reagent lists, and shareable export.
---
Features
Protocol library — sidebar with search and tag filtering
Rich step editor — title, description, duration, drag-to-reorder
Per-step reagents — name, amount, unit for each step
Step comments — annotate individual steps with dated, named comments
Version history — save named versions, browse history, restore old versions
Export/Import — share protocols as portable `.json` files
Auto-saves to `~/Protolog/` (your Documents area) — no cloud required
---
Windows 11 Setup Instructions
Step 1 — Install Node.js
Go to https://nodejs.org
Download the LTS version (the left button — currently 20.x or 22.x)
Run the installer, click Next through everything, keep all defaults
When done, open Windows Terminal (search it in Start) and type:
```
   node --version
   ```
You should see something like `v20.11.0`. If so, Node.js is installed.
---
Step 2 — Get the Protolog files
You need the project folder. You have two options:
Option A — Copy from this build (simplest)
Extract the `protolog` folder somewhere permanent, e.g.:
```
C:\Users\YourName\Documents\protolog
```
Option B — Git (optional, for future updates)
If you install Git from https://git-scm.com, you can `git clone` the repo instead.
---
Step 3 — Install dependencies
Open Windows Terminal
Navigate to the protolog folder:
```
   cd C:\Users\YourName\Documents\protolog
   ```
(adjust the path to wherever you put it)
Run:
```
   npm install
   ```
This downloads Electron and its dependencies. It will take 1–3 minutes and download about 200 MB. This only needs to be done once.
---
Step 4 — Run the app
From the same terminal, in the protolog folder:
```
npm start
```
The app window will open. First launch asks for your name (used in step comments).
To open it quickly in the future, create a `.bat` file:
Open Notepad
Paste this (adjust path):
```
   @echo off
   cd /d C:\Users\YourName\Documents\protolog
   npm start
   ```
Save as `Protolog.bat` on your Desktop
Double-clicking that will launch the app.
---
Step 5 (Optional) — Build a proper .exe installer
If you want a real installable `.exe` you can share with others:
```
npm run build-win
```
This creates an installer in the `dist/` folder. The installer will add Protolog to your Start menu and create a Desktop shortcut.
> Note: First build may take 5–10 minutes as it downloads the Electron binary.
---
Data storage
All protocols are saved as `.json` files in:
```
C:\Users\YourName\Protolog\
```
You can back this folder up, sync it to OneDrive/Dropbox, or copy it between computers.
---
Sharing protocols
Open a protocol → click Export → saves a `.json` file you can email or share
Colleague receives it → clicks Import in their sidebar → it appears in their library
Comments and full version history travel with the file
---
Keyboard shortcuts
Shortcut	Action
`Ctrl + S`	Save protocol
`Escape`	Close modal
---
Troubleshooting
`npm install` fails with permission errors
Run Windows Terminal as Administrator (right-click → Run as administrator)
App doesn't open / blank window
Run `npm start` from the terminal and look at the error message. Common cause: Node.js not properly installed.
"electron is not recognized"
Run `npm install` again from inside the protolog folder.
Where is my data?
`C:\Users\YourName\Protolog\` — one `.json` file per protocol. Click "📁 Data folder" in the app sidebar to open it directly.
