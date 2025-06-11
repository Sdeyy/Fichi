# 🤖 Discord Bot – Ticket System & Administration

This is a Discord bot featuring a ticket system, role management, interactive buttons, invite tracking, and more.

## 🚀 Main Features

- 📩 Ticket system with buttons, closing, and transcript generation.
- 🔒 Blacklist to block users from using the system.
- 🎭 Temporary and reaction-based roles.
- 📈 Invite tracking system.
- 🎱 General commands like 8ball and custom embeds.
- 🎶 Music playback from YouTube, Spotify, and SoundCloud.

## ⚙️ Requirements

- Node.js v18+ → [Download Node.js](https://nodejs.org/es/download)
- MongoDB → [Download MongoDB](https://www.mongodb.com/try/download/community)
- FFmpeg
- A code editor like:
  - [Visual Studio Code](https://code.visualstudio.com/)
  - [Sublime Text 3](https://www.sublimetext.com/3)
  - [Atom (deprecated but still usable)](https://github.com/atom/atom/releases)
  - [JetBrains WebStorm](https://www.jetbrains.com/webstorm/)



## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Sdeyy/Fichi.git
   cd your-folder
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure the bot by editing the files in `data/settings/`:
   - `config.yml`
   - `buttons.yml`
   - `embeds.yml`
   - `language.yml`

## ▶️ Run the Bot

```bash
node .
```


## 🛠️ How to install FFmpeg on Windows

This bot requires **FFmpeg** to handle audio/video features. You can install it easily using **Chocolatey**:

### Step 1: Open PowerShell as Administrator

- Search for **PowerShell** in the Start menu.
- Right-click and select **Run as administrator**.

### Step 2: Install FFmpeg with Chocolatey

If you have Chocolatey installed, run:

```powershell
choco install ffmpeg -y
```

This will download and install FFmpeg, and add it automatically to your system PATH.

### Step 3: Verify the installation

Open a new PowerShell or Command Prompt window and run:

```bash
ffmpeg -version
```

If you see version info, FFmpeg was installed successfully!

---

### Note

If you don’t have Chocolatey installed yet, visit https://chocolatey.org/install for instructions or ask for help.
