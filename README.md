<p align="center">
  <img src="images/logo.png" alt="AK logo" width="110">
</p>

<h1 align="center">AK Knockout Studio</h1>

<p align="center">
  A Windows video editor where your video plays <strong>inside the letters</strong> — over a colour, gradient or image background — with credits rolls, tickers, crawls and dozens of other text motions.
</p>

<p align="center">
  <a href="https://github.com/AK30072002/ak-knockout-studio/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/AK30072002/ak-knockout-studio?label=download&color=f44336"></a>
  <img alt="Windows 10 and 11" src="https://img.shields.io/badge/Windows-10%20%7C%2011-4f7cac">
</p>

<p align="center">
  <a href="https://github.com/AK30072002/ak-knockout-studio/releases/latest"><strong>⬇ Download for Windows</strong></a>
</p>

![AK Knockout Studio editor](images/screenshot.png)

## Download and install

1. Open the [latest release](https://github.com/AK30072002/ak-knockout-studio/releases/latest).
2. Under **Assets**, download one of these files:

   | File | What it is |
   | --- | --- |
   | `AK-Knockout-Studio-Setup-1.0.0.exe` | **Installer (recommended).** Adds a desktop shortcut, a Start menu entry and an uninstaller. |
   | `AK-Knockout-Studio-1.0.0-portable.exe` | Runs straight away with nothing installed, for example from a USB stick. Opens a little slower. |

3. Double-click the file you downloaded.
4. If Windows shows **"Windows protected your PC"**, click **More info**, then **Run anyway**. This appears because the app isn't signed with a paid certificate; it only happens the first time.

**To uninstall:** open **Settings → Apps → Installed apps**, find **AK Knockout Studio**, and click **Uninstall**.

**Requirements:** Windows 10 or 11 (64-bit). An internet connection is only needed for the built-in fonts.

Your videos are never uploaded anywhere. Everything, including export, happens on your own computer.

## What it does

You start with one video. The editor covers it with a background of your choice (plain black by default) and cuts text out of that background, so the video shows through the letters only.

### Text styles

Each text layer has a fill mode. **Video in text** is the knockout effect described above. **Video around text** does the opposite: the text becomes a solid cut-out and the video fills everything else. **Video outline** shows the video only in the letter outlines, and **Solid** is ordinary coloured text for captions. Every layer can also have an outline, a glow or a drop shadow, and you choose the font (sixteen built in, or load your own .ttf/.otf/.woff), weight, size, letter spacing, line height, alignment, italics and capitals.

### Background

The background can be a solid colour, a linear or radial gradient, an image (cover, fit, stretch or tile), a blurred and tinted copy of the video itself, or nothing at all. Lowering the background opacity lets a faint copy of the video through, which is a nice way to hint at the footage before the text reveals it.

### Scroll and motion effects

Every text layer has one motion, chosen from the Motion panel or added from a preset.

| Group | Effects |
| --- | --- |
| Scroll | Credits roll up, scroll down, scroll left (ticker), scroll right, diagonal up, diagonal down, endless horizontal marquee, endless vertical loop, ping-pong, perspective crawl into the distance, zoom-through |
| Entrance | Slide in from any side, zoom in, zoom out, bounce, typewriter, letter by letter, wipe |
| Continuous | Pulse, wave, float, spin, shake |

Scrolls can be timed to fit the layer's length exactly or run at a fixed speed. Every effect has easing, fade in and fade out, and its own settings such as gap, amount and frequency.

**Presets** give you a finished starting point in one click: knockout title, credits roll, news ticker, perspective crawl, zoom-through reveal, side scroll, vertical endless loop, diagonal sweep, wavy headline, typewriter caption and video frame.

### Editing

- **Timeline** with one track per text layer plus the background and video tracks. Drag bars to move them, drag their edges to change start and end, and snap to the playhead, the clip ends and other layers. Zoom with the slider or Ctrl + mouse wheel.
- **Trim** the video with in and out points, change playback **speed**, boost **volume** up to 200 % or mute it.
- **Framing**: fill, fit or stretch, plus zoom, position, rotation and flips.
- **Colour**: brightness, contrast, saturation, hue, blur, greyscale, sepia and invert.
- **Layers**: add, duplicate, split at the playhead, reorder, hide, lock and delete. Drag text directly on the video, with centre snapping and optional safe-area guides.
- **Canvas**: 16:9, 9:16, 1:1, 4:5, 4:3, 21:9 or the video's own shape, at 24, 25, 30, 50 or 60 fps.
- **Undo and redo**, automatic saving, project files you can save and reopen, and full-resolution PNG snapshots.

### Export

**Export video** saves the finished video with sound, at full, three-quarter, half or one-third resolution. The export window shows which file formats are available (MP4 or WebM).

## How to use it

1. **Import your video** with the **Import media** button, or drag a video file onto the preview. Until you do, a demo animation plays so you can try everything.
2. **Choose a background** by clicking the **Background** layer.
3. **Edit the title**, or add new text with **Add text** or the **Add a preset** menu.
4. **Pick a motion** in the **Motion and scroll** section, then adjust timing on the timeline.
5. Click **Export video** and choose where to save it.

You can also drag an image onto the preview to make it the background, or drag a saved project file onto it to open it.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← / → | Step one frame |
| Shift + ← / → | Jump one second |
| Home / End | Go to start / end |
| I / O | Set trim in / out at the playhead |
| T | Add a text layer |
| S | Split the selected layer at the playhead |
| Ctrl + D | Duplicate the selected layer |
| Delete | Delete the selected layer |
| Ctrl + Z / Ctrl + Y | Undo / redo |
| Ctrl + S / Ctrl + O | Save / open a project |
| Ctrl + E | Export video |
| L | Loop playback on or off |
| G | Safe-area guides on or off |
| M | Mute |
| F | Full screen |
| ? | Show all shortcuts |
| Esc | Deselect |

## Good to know

- **Export happens in real time.** A 30-second video takes about 30 seconds to export.
- **Project files don't contain the video.** A saved project (`.akks.json`) keeps your text, settings and background images. After opening a project, import the same video again and your trim is restored.
- **Supported videos:** MP4 (H.264) and WebM work best. Some MOV and MKV files may not open.
- **Found a problem or have an idea?** Open an [issue](https://github.com/AK30072002/ak-knockout-studio/issues).

## Credits

Made by **AJAIKRISHNA**. © 2026 AJAIKRISHNA. All rights reserved.
