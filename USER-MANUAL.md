# AK Knockout Studio 2 — User Manual

Welcome to **AK Knockout Studio 2**, a free video editor for Windows and the web browser, made by AJAIKRISHNA.

Everything in this editor is free. There is no watermark, no account, no subscription and no "Pro" version. Your videos never leave your computer: editing and exporting both happen on your own machine.

This manual explains every feature from start to finish. If you only want to make your first video quickly, read **Part 2: Quick start** and come back to the rest later.

![AK Knockout Studio 2](images/screenshot.png)

---

## Contents

1. [What you can do](#1-what-you-can-do)
2. [Quick start: your first video in 5 minutes](#2-quick-start-your-first-video-in-5-minutes)
3. [Installing and opening the editor](#3-installing-and-opening-the-editor)
4. [A tour of the screen](#4-a-tour-of-the-screen)
5. [The video track: clips](#5-the-video-track-clips)
6. [Trimming, splitting and speed](#6-trimming-splitting-and-speed)
7. [Transitions](#7-transitions)
8. [Looks and colour adjustments](#8-looks-and-colour-adjustments)
9. [Motion (Ken Burns) and framing](#9-motion-ken-burns-and-framing)
10. [Canvas: shape, size and frame rate](#10-canvas-shape-size-and-frame-rate)
11. [Background](#11-background)
12. [Text and titles](#12-text-and-titles)
13. [Overlays: picture-in-picture, logos, stickers and green screen](#13-overlays-picture-in-picture-logos-stickers-and-green-screen)
14. [Audio: music, sound effects and voiceover](#14-audio-music-sound-effects-and-voiceover)
15. [Working with the timeline](#15-working-with-the-timeline)
16. [Exporting your video](#16-exporting-your-video)
17. [Saving, opening and reconnecting projects](#17-saving-opening-and-reconnecting-projects)
18. [Keyboard shortcuts](#18-keyboard-shortcuts)
19. [Step-by-step recipes](#19-step-by-step-recipes)
20. [Troubleshooting and questions](#20-troubleshooting-and-questions)
21. [What the editor does not do](#21-what-the-editor-does-not-do)

---

## 1. What you can do

AK Knockout Studio 2 has the everyday tools you would expect from apps like InShot or CapCut, plus its own signature effect: **knockout text**, where your video plays inside the letters.

| Feature | What it means |
| --- | --- |
| **Multi-clip video track** | Put any number of videos, photos and colour clips one after another. Reorder, trim, split, duplicate and delete them. |
| **Speed control** | Slow motion down to 0.1× or fast motion up to 8×, per clip. |
| **Transitions** | 12 transitions between clips: cross dissolve, dip to black, flash, push in 4 directions, wipe left or right, circle reveal, zoom and blur. |
| **Looks (filters)** | 12 one-tap looks such as Cinematic, Vintage, Golden hour and Noir. |
| **Adjustments** | Brightness, contrast, saturation, warmth, hue, sharpen, vignette, film grain, blur, greyscale, sepia, invert. |
| **Ken Burns motion** | Slow zoom in, zoom out or pan across a clip. Perfect for photo slideshows. |
| **Freeze frame** | Hold any moment of a video as a still picture. |
| **Text** | Unlimited text layers, 16 fonts plus your own, 11 ready-made presets and 26 animations, including credits rolls, tickers and typewriter captions. |
| **Knockout text** | The video shows only inside the letters, around the letters, or in the letter outlines. |
| **Overlays** | Picture-in-picture videos, logos, stickers and transparent PNGs, with rounded corners, borders, shadows, blend modes and 19 animations. |
| **Green screen** | Remove a green, blue, white or black background from any overlay. |
| **Music and sound effects** | Unlimited audio tracks with volume up to 200 %, fade in and out, cutting and looping. |
| **Voiceover** | Record your voice straight onto the timeline. |
| **Extract audio** | Separate a clip's sound onto its own track so you can move or cut it independently. |
| **High-quality export** | Frame-by-frame rendering in H.264, HEVC, AV1 or VP9, from 480p up to 4K, up to 80 Mbps, 24 to 60 fps. |
| **Upscaling** | Export a 1080p project at 2K or 4K, with optional sharpness enhancement. |
| **Sound-only export** | Save the finished soundtrack as a WAV file. |
| **Projects** | Undo and redo (150 steps), automatic saving, project files and PNG snapshots. |

---

## 2. Quick start: your first video in 5 minutes

1. **Open the editor.** A colourful demo animation plays inside the big "AK STUDIO" title. That's the knockout effect.
2. **Add your videos.** Click **Import media** at the top (or press **Ctrl + I**) and choose one or more videos or photos. You can select several files at once. They appear on the **Video** row of the timeline in the order you chose them. The first import replaces the demo.
3. **Change the title.** Click **Title** in the Layers panel on the left. In the panel on the right, type your own words in the **Content** box.
4. **Add music.** Click **Import media** again and choose an MP3 or other music file. It appears as a purple bar at the bottom of the timeline.
5. **Add a transition.** On the Video row, click the small round **+** marker where two clips meet. On the right, choose **Cross dissolve** under **Transition**.
6. **Play it.** Press the **Space bar**.
7. **Export.** Click the red **Export video** button, keep the recommended settings, and click **Start export**. Your video is saved to your Downloads folder.

**Want a normal video without the knockout effect?** Click **Background** in the Layers panel and choose **None**. The whole video then shows, and your text sits on top of it. Set the text's **Fill mode** to **Solid** to make it ordinary coloured text.

---

## 3. Installing and opening the editor

You can use AK Knockout Studio in three ways.

| Way | How |
| --- | --- |
| **Windows installer** (recommended) | Download `AK-Knockout-Studio-Setup-2.0.0.exe` from the GitHub Releases page and double-click it. It adds a desktop shortcut and a Start menu entry. |
| **Windows portable** | Download `AK-Knockout-Studio-2.0.0-portable.exe`. It runs without installing, for example from a USB stick. It opens a little more slowly. |
| **In the browser** | Open the online version in **Chrome** or **Edge**. Nothing to install. |

**If Windows shows "Windows protected your PC"**, click **More info**, then **Run anyway**. This appears because the app isn't signed with a paid certificate. It's safe.

**Upgrading from version 1:** just install version 2. Your old `.akks.json` project files open in version 2 automatically. The old single "Source" video becomes clip 1 on the new video track, with its trim, speed, volume, framing and colour settings kept.

**Best experience:** the Windows app, or a current version of Chrome or Edge. Firefox and Safari can edit, but their export options are more limited.

---

## 4. A tour of the screen

The editor has five areas.

### Top bar

| Control | What it does |
| --- | --- |
| **Project name** | Click it to rename your project. The name is used for exported files. |
| **New** | Start an empty project. |
| **Open** | Open a saved project file (`.akks.json`). |
| **Save** | Save the project to a file. |
| **Undo / Redo** (curved arrows) | Step backward or forward through your changes. |
| **Import media** | Add videos, photos or music. |
| **Snapshot** | Save the current frame as a full-resolution PNG picture. |
| **?** | Show the keyboard shortcuts. |
| **Export video** | Open the export window. |

### Layers panel (left)

- **Add text** adds a new text layer. **Text preset…** adds a ready-made text effect.
- **＋ Add video, overlay, music…** opens a menu with: Video or photo clip, Overlay (picture-in-picture, logo, sticker), Music or sound effect, Record a voiceover, Colour clip, Freeze frame at the playhead, and Background image.
- The list shows everything in your project in groups: **Text**, **Overlays**, **Audio**, **Background** and **Video track**. Click any item to select it and see its settings on the right.
- The **eye** icon hides or shows a text or overlay layer. The **lock** icon stops it from being moved by accident. The **speaker** icon mutes or unmutes an audio track.
- The buttons at the bottom work on whatever is selected: **Duplicate**, **Split** (at the playhead), **▲ / ▼** (change order), and **Delete**.

### Stage (centre)

This is the preview of your video. You can **drag text and overlays** directly on it. They snap to the centre; hold **Alt** to move freely. **Scroll the mouse wheel** over a selected overlay to resize it.

Below the stage is the **transport bar**:

| Control | What it does |
| --- | --- |
| ⏮ ◀ ▶ ▶ ⏭ | Go to start, step one frame back, play/pause, step one frame forward, go to end |
| Time display | Current time / total length (minutes:seconds:frames) |
| **Loop** | Play again from the start when the end is reached |
| **Guides** | Show thirds lines and safe-area boxes, so text isn't cut off on TVs and phones |
| **Microphone** | Record a voiceover (see section 14) |
| **Speaker and slider** | Master volume and mute for the whole project |
| **Full screen** | Preview in full screen |

### Properties panel (right)

Shows the settings for whatever you've selected: a clip, text, overlay, audio track or the background. With nothing selected, it shows the **Project** settings. Click a heading such as **Trim** or **Looks** to open or close that section.

### Timeline (bottom)

The timeline shows everything over time, from top to bottom:

1. **Overlays placed above text** (orange bars)
2. **Text layers** (green bars)
3. **Overlays placed below text** (orange bars)
4. **Background** (grey bar)
5. **Video** (all your clips in one row, with thumbnails)
6. **Audio tracks** (purple bars)

The red line is the **playhead**, the current time. Click or drag on the ruler at the top to move it. Drag the thin line above the timeline to make it taller or shorter.

---

## 5. The video track: clips

The **Video** row holds your main footage. Clips play one after another from left to right.

### Adding clips

- **Import media** (or **Ctrl + I**): choose any number of videos and photos. They are added to the end of the video track. The very first import replaces the demo animation.
- **＋ Add → Video or photo clip**: the same thing.
- **Drag and drop** video files onto the stage. To drop a **photo as a clip**, hold **Ctrl** while dropping (a plain photo drop sets the background instead).
- **＋ Add → Colour clip**: a plain colour screen, 3 seconds long. Use it for title cards, a black gap, or an ending screen. Change its colour and length on the right.

Photos become 5-second clips. Change their length with **Duration** in the Media section.

### Selecting a clip

Click the clip on the timeline, or its name under **Video track** in the Layers panel. Clicking it in the Layers panel also moves the playhead to that clip.

### Reordering clips

- **Drag a clip by its middle** on the timeline and drop it in a new place.
- Or select it and use the **▲** (move later) and **▼** (move earlier) buttons.

### Duplicating (copying) a clip

Select it and press **Ctrl + D**, or click **Duplicate**. The copy appears straight after the original with all the same settings. This is how you repeat a moment, or use the same footage twice with different effects.

### Deleting a clip

Select it and press **Delete**. The video track must keep at least one clip; to swap your only clip, use **Replace media** instead.

### Replacing a clip's media

Select the clip, then click **Replace media** in the Media section and choose a new file. The clip keeps its position, transition, look, framing, speed and volume. Only the footage changes.

**Use demo animation** swaps the clip back to the built-in demo.

### Freeze frame

1. Move the playhead to the moment you want to hold.
2. Choose **＋ Add → Freeze frame at the playhead**, or click **Freeze frame** in a clip's Media section.

The clip is split at that moment and a 2-second still picture is inserted. Change its length with **Duration**.

### Clip sound

In **Speed and sound**, each video clip has:

- **Volume** from 0 % to 200 %.
- **Mute this clip**.
- **Sound fade in** and **Sound fade out**, in seconds.
- **Extract audio to a track**: moves the clip's sound onto its own audio track (the clip is muted), so you can move, cut or fade the sound separately. The clip must be at 1× speed.

---

## 6. Trimming, splitting and speed

### Trimming (cutting the start or end)

There are three ways. Use whichever is easiest.

1. **Drag the edges.** On the timeline, drag the left or right edge of a clip. The cursor changes to a double arrow at the edges.
2. **Use the playhead.** Play or step to the first frame you want, then press **I** (in point). Go to the last frame you want and press **O** (out point).
3. **Type exact times.** In the clip's **Trim** section, use the **In point** and **Out point** sliders or type seconds into the boxes.

**Reset** in the Trim section brings back the whole clip. Trimming never damages your original file.

### Splitting

Move the playhead to where you want to cut, select the clip, and press **S** (or click **Split**). You get two clips you can move, delete or style separately. To **remove a middle part**, split twice and delete the piece in between.

Split also works on text layers, overlays and audio tracks.

### Speed

In the clip's **Speed and sound** section:

- Drag **Speed** anywhere from **0.1×** (very slow) to **8×** (very fast), or
- Click a quick button: **0.25×**, **0.5×**, **1×**, **2×** or **4×**.

A 10-second clip at 2× becomes 5 seconds long on the timeline. While previewing (and in real-time exports) the sound keeps its normal pitch. In high-quality exports, sped-up or slowed-down sound changes pitch like a tape (higher when faster, lower when slower), so for big speed changes you may prefer to mute the clip and use music instead.

---

## 7. Transitions

A transition smoothly joins one clip to the next.

### Adding a transition

1. On the **Video** row, find the small round marker where two clips meet. **+** means no transition yet; a red **⇄** means one is set.
2. Click it. The clip after the join is selected and its **Transition** section opens on the right.
3. Choose a transition from the list, and set its **Length** (0.1 to 3 seconds).

### The transitions

| Transition | Looks like |
| --- | --- |
| **None (cut)** | An instant switch |
| **Cross dissolve** | The first clip fades into the second |
| **Dip to black** | Fades to black, then up into the next clip |
| **Flash (dip to white)** | A quick flash of white between clips |
| **Push left / right / up / down** | The new clip pushes the old one off the screen |
| **Wipe left / right** | The new clip is revealed by a moving edge |
| **Circle reveal** | The new clip grows out of a circle in the centre |
| **Zoom** | The old clip zooms towards you as the new one appears |
| **Blur** | The old clip blurs away and the new one comes into focus |

**Use on every cut** copies the current transition to every join in the video in one click.

**Good to know:** during a transition both clips play at the same time, overlapping. So each transition makes the total video slightly shorter. The sound crossfades too. If a clip is very short, the transition is automatically shortened to fit.

---

## 8. Looks and colour adjustments

Every clip has its own colour settings. They apply everywhere that clip appears, including inside knockout letters.

### Looks (one-tap filters)

Select a clip and open **Looks**. Tap one:

| Look | Style |
| --- | --- |
| Original | No changes |
| Vivid | Richer colour and a little more contrast |
| Punchy | Strong contrast and colour, slightly sharpened |
| Warm | Golden, cosy tones |
| Cool | Blue, crisp tones |
| Golden hour | Strong sunset warmth |
| Cinematic | Film-like contrast, cooler tones and a soft vignette |
| Dreamy | Bright, soft and gentle |
| Faded | Washed-out, matte style |
| Vintage | Old-photo colours with grain and vignette |
| Black & white | Classic monochrome |
| Noir | Dramatic high-contrast black and white with grain |

A look is a starting point. It fills in the **Adjustments** below, which you can then fine-tune.

### Adjustments

| Adjustment | Range | What it does |
| --- | --- | --- |
| Brightness | 0–200 % | Lighter or darker |
| Contrast | 0–200 % | Difference between light and dark |
| Saturation | 0–300 % | Colour strength (0 = black and white) |
| Warmth | −100 to +100 | Negative = cooler (blue), positive = warmer (orange) |
| Hue | −180° to 180° | Shifts all colours around the colour wheel |
| Sharpen | 0–100 % | Crisper detail (uses your graphics card) |
| Vignette | 0–100 % | Darkens the corners to draw the eye to the centre |
| Film grain | 0–100 % | Adds moving film grain |
| Blur | 0–30 px | Softens the whole clip |
| Greyscale, Sepia, Invert | 0–100 % | Special colour effects |

- **Apply to all clips** copies this clip's look and adjustments to every clip, so the whole video matches.
- **Reset** returns this clip to its original colours.

---

## 9. Motion (Ken Burns) and framing

### Motion

Open a clip's **Motion** section and choose a **Camera move**:

- **Slow zoom in (Ken Burns)** or **Slow zoom out**
- **Pan left**, **Pan right**, **Pan up**, **Pan down**

**Strength** makes the movement smaller or bigger. The movement runs smoothly across the whole length of the clip, which makes photos feel alive.

### Framing

Controls how a clip fills the frame:

- **Fit mode:** **Fill** covers the whole frame (edges may be cut off), **Fit** shows the whole picture (with black bars if the shapes differ), **Stretch** fills exactly (may distort).
- **Zoom**, **Move X**, **Move Y**: crop in and reposition, for example to reframe a landscape video for a vertical Reel.
- **Rotate**, plus **↺ 90°** and **↻ 90°** buttons: fix sideways phone videos.
- **Flip horizontally / vertically**: mirror the picture.
- **Reset framing** undoes all of these.

---

## 10. Canvas: shape, size and frame rate

Click an empty part of the stage (or press **Esc**) to see the **Project** settings.

**Aspect ratio:**

| Choice | Size | Use it for |
| --- | --- | --- |
| 16:9 | 1920 × 1080 | YouTube, TVs, laptops |
| 9:16 | 1080 × 1920 | Instagram Reels, YouTube Shorts, TikTok, WhatsApp Status |
| 1:1 | 1080 × 1080 | Square posts |
| 4:5 | 1080 × 1350 | Instagram feed posts |
| 4:3 | 1440 × 1080 | Classic TV shape |
| 21:9 | 2560 × 1080 | Ultra-wide cinema look |
| Match first clip | Your clip's size | Keeps your footage's own shape |

**Frame rate:** 24 fps (cinema feel), 25, 30 (standard), 50 or 60 fps (smooth motion, good for sports and gaming).

**Master sound:** one volume slider and mute switch for the whole project.

**Preview quality:** choose **Half** or **Quarter** if playback stutters on a slower computer. This only affects the preview; exports always use the resolution you pick in the export window.

---

## 11. Background

Select **Background** in the Layers panel. The background sits on top of your video, and knockout text cuts holes in it to reveal the video.

| Type | What it is |
| --- | --- |
| **Colour** | A solid colour (black by default) |
| **Gradient** | Two colours blending, linear (with angle) or radial |
| **Image** | Your own picture: Fill, Fit, Stretch or Tile, with a backdrop colour |
| **Blur** | A blurred, tinted copy of your video. Great behind vertical videos |
| **None** | No background: the full video shows, and text sits on top |

**Opacity** lets a faint copy of the video show through the background.

To set a background image quickly, **drop a photo onto the stage**, or use **＋ Add → Background image**.

---

## 12. Text and titles

### Adding text

- **Add text** (or press **T**) adds a blank text layer that runs the whole length of the video.
- **Text preset…** adds a finished effect:

| Preset | What it makes |
| --- | --- |
| Knockout title | Big title with the video inside the letters |
| Credits roll (scroll up) | End credits rolling up the screen |
| News ticker (endless marquee) | A never-ending line of text moving sideways |
| Perspective crawl | Text flying away into the distance, like the famous space-film opening |
| Zoom-through reveal | The camera flies into the letters |
| Side scroll (ticker once) | Text crossing the screen once |
| Vertical endless loop | Text looping upward forever |
| Diagonal sweep | Text sweeping diagonally across |
| Wavy headline | Letters moving in a wave |
| Typewriter caption | A caption typed letter by letter |
| Video frame (video around text) | Solid letters with the video all around them |

### Editing text

Select a text layer, then on the right:

- **Text:** type the words in **Content** (press Enter for a new line), and rename the layer.
- **Font:** choose from 16 fonts, or click **Upload a font file** to use your own `.ttf`, `.otf`, `.woff` or `.woff2`. Set weight, size, letter spacing, line height, alignment, italic and ALL CAPS.
- **Look → Fill mode**, the knockout magic:
  - **Video in text**: the video shows only inside the letters.
  - **Video around**: solid letters with the video everywhere else.
  - **Video outline**: the video shows only in the outline of the letters.
  - **Solid**: normal coloured text, for captions and subtitles.
  - You can also add an **outline**, a **glow or shadow**, and change **opacity**.
- **Position:** drag the text on the stage, or use the sliders for position, rotation and scale, and the centring buttons.
- **Motion and scroll:** choose one of 26 effects (below).
- **Timing:** when the text appears and disappears. Use **Start at playhead**, **End at playhead** or **Full length**, or drag the ends of its green bar on the timeline.

### Text animations

| Group | Effects |
| --- | --- |
| **Scroll** | Scroll up (credits roll), scroll down, scroll left (ticker), scroll right, diagonal up, diagonal down, endless marquee horizontal, endless loop vertical, ping-pong, perspective crawl, zoom-through |
| **Entrance** | Slide in from left, right, bottom or top, zoom in, zoom out, drop and bounce, typewriter, letter-by-letter fade, wipe reveal |
| **Continuous** | Pulse, wave, float, spin, shake |

Each effect has its own settings, such as speed, easing (linear, ease in, ease out, overshoot, bounce), fade in and fade out. Scrolls can **fit the layer's length exactly** or run at a fixed speed.

### Layer order

The layer at the top of the Text list is drawn on top. Use **▲ / ▼** to change the order. Use the **eye** to hide a layer and the **lock** to protect it.

---

## 13. Overlays: picture-in-picture, logos, stickers and green screen

An overlay is a picture or video placed **on top of** your main video.

### Adding an overlay

- **＋ Add → Overlay: picture-in-picture, logo, sticker**, then choose a photo, a transparent PNG, or a video.
- Or **hold Shift** while dropping a picture onto the stage.

The overlay starts at the playhead and appears as an orange bar on the timeline.

### Size and position

- **Drag it** on the stage to move it. **Scroll the mouse wheel** over it to resize.
- Or use the **Size**, **Horizontal**, **Vertical**, **Rotate** and **Opacity** sliders.
- Quick buttons put it in a corner (**↖ ↗ ↙ ↘**), in the **Centre**, or make it **Full screen**.

### Style

- **Rounded corners**: 0 % is square, 100 % is fully rounded (a circle for square pictures).
- **Border**: colour and width. **Shadow**: colour, softness and offset.
- **Blend mode**: Normal, **Screen** (makes black parts see-through, great for light leaks, sparks and fire effects on black), **Multiply** (makes white parts see-through, great for logos on white paper), Overlay, Soft light, Lighten, Darken, Difference.
- **Place**: **Above text** or **Below text**.

### Remove background (green screen)

1. Open **Remove background** and tick **Remove a colour (green screen)**.
2. Choose the colour: **Green**, **Blue**, **White**, **Black**, or pick any colour.
3. Raise **Strength** until the background disappears, and use **Edge softness** to smooth the edges.

This works best on footage filmed against a smooth, evenly lit green or blue screen.

### Video overlays (picture-in-picture)

- **Start inside video** chooses which part of the overlay video plays.
- Tick **Play its sound** to hear it, and set its **Volume**. Overlay videos are silent by default.

### Animation and timing

Overlays have 19 animations (slides, zooms, bounce, wipe, pulse, float, spin, shake and scrolls) plus fade in and out. Set when the overlay appears in **Timing**, or drag its orange bar.

---

## 14. Audio: music, sound effects and voiceover

### Adding music or sound effects

- **Import media** with an MP3, WAV, M4A, AAC, OGG, OPUS or FLAC file adds it from the start of the video.
- **＋ Add → Music or sound effect** adds it at the playhead, which is handy for sound effects.

Each audio file becomes a purple track at the bottom of the timeline.

### Editing an audio track

Select the track, then:

| Setting | What it does |
| --- | --- |
| **Volume** | 0 % to 200 % |
| **Mute** | Silence this track (or click the speaker icon in the Layers panel) |
| **Fade in / Fade out** | Smooth start and end, up to 15 seconds |
| **Repeat until the video ends** | Loops short music to fill the whole video |
| **Starts at** | Where it begins on the timeline |
| **Cut start / Cut end** | Which part of the song plays |
| **Start at playhead / Start at 0** | Quick positioning |
| **End with the video** | Cuts the music to finish when the video finishes and adds a gentle fade out |

**On the timeline:** drag the purple bar to move it, drag its **left edge** to cut the beginning, and drag its **right edge** to cut the end.

You can **split** (S), **duplicate** (Ctrl + D) and **delete** audio tracks too.

### Recording a voiceover

1. Plug in headphones, so the video's sound doesn't echo into your recording.
2. Move the playhead to where your voice should start.
3. Click the **microphone button** in the transport bar (or press **R**). Allow microphone access if asked.
4. The video plays while you speak. The button pulses red.
5. Click the button again (or press **R**) to stop.

Your recording appears as a new track called **Voiceover 1** (then 2, 3…), placed exactly where you started. A copy of the recording is also **saved to your Downloads folder**. Keep that file, because you'll need it to reopen the project later.

### Mixing tips

- Lower the music to about **25–40 %** under a voiceover.
- Use the **Master volume** (transport bar or Project panel) to make everything louder or quieter together.
- Use **Extract audio to a track** on a clip to reuse its sound somewhere else, or to cut the sound separately from the picture.

---

## 15. Working with the timeline

| Action | How |
| --- | --- |
| Move the playhead | Click or drag on the ruler, or click an empty part of a row |
| Zoom in and out | The magnifier slider, or **Ctrl + mouse wheel** |
| See everything | Click **Fit** |
| Move a text, overlay or audio bar | Drag its middle |
| Change start or end | Drag its left or right edge |
| Reorder clips | Drag a clip's middle along the Video row |
| Trim a clip | Drag a clip's edge |
| Edit a transition | Click the round marker between two clips |
| Select something | Click its bar, or the name at the left of its row |
| Snapping | With **Snap** ticked, bars jump to the playhead, clip boundaries and other bars. Untick it for free movement |
| Resize the timeline | Drag the line along its top edge |

---

## 16. Exporting your video

Click **Export video** (or press **Ctrl + E**).

### Method

| Method | When to use it |
| --- | --- |
| **High quality, frame by frame (recommended)** | Final videos. Every single frame is rendered exactly, so nothing is ever dropped or stuttery, even on slower computers. It can take longer than the video's own length. |
| **Real-time recording** | If High quality isn't offered by your browser. The video plays through once while recording, so it takes about as long as the video. Keep the window visible. |
| **Sound only (WAV)** | Save just the mixed soundtrack (clip sound, music, voiceovers) as an uncompressed WAV file. |

### Format

Only formats that your computer can actually create are listed.

| Format | Best for |
| --- | --- |
| **MP4 · H.264** | Plays everywhere: phones, WhatsApp, Instagram, YouTube, TVs. The safest choice. |
| **MP4 · H.265 / HEVC** | Similar quality in a smaller file. Plays on most modern phones and computers. |
| **MP4 · AV1** | The smallest files. Great for YouTube; some older devices can't play it. |
| **WebM · VP9 / AV1** | For websites and web players. |

### Resolution and upscaling

Choose **Project size** or one of: **4K Ultra HD**, **2K QHD**, **Full HD**, **HD**, **SD**. Sizes bigger than your project are marked **(upscaled)**.

When you upscale, text, shapes and effects are drawn freshly at the higher resolution, so they stay perfectly sharp. Your footage is enlarged with high-quality smoothing. Tick **Enhance sharpness** (switched on automatically when upscaling) to make enlarged footage look crisper. Note that this is sharpening, not AI, so it can't invent detail that isn't in the original.

### Frame rate and quality

- **Frame rate:** usually match your project. Choose 60 fps for smooth action.
- **Quality:** **Auto** picks a strong bitrate for the chosen size (about 16 Mbps for 1080p at 30 fps, about 65 Mbps for 4K). Choose from **4 Mbps** (small file) up to **80 Mbps** (maximum) yourself if you prefer.
- **Include sound** and **Sound quality** (128, 192 or 320 kbps).
- **Choose where to save first** (shown when your browser supports it): saves straight to a file you choose while exporting. Best for long or 4K videos, because the video isn't held in memory.

The window shows an **estimated file size** before you start.

### Recommended settings

| Where it's going | Canvas | Resolution | Format | Frame rate |
| --- | --- | --- | --- | --- |
| YouTube | 16:9 | Full HD or 4K | MP4 · H.264 (or AV1) | 30 or 60 |
| Instagram Reels, Shorts, TikTok | 9:16 | Project size (1080 × 1920) | MP4 · H.264 | 30 |
| Instagram feed | 4:5 or 1:1 | Project size | MP4 · H.264 | 30 |
| WhatsApp | any | HD | MP4 · H.264, Quality "Good" | 30 |
| Keeping a master copy | any | Project size or higher | MP4 · H.264, Quality "Studio" or higher | same as project |

### During and after export

A progress bar shows the frame count and the time left. Click **Stop export** to cancel. When it's finished, the file goes to your **Downloads** folder (or where you chose), and **Download again** gives you another copy.

**Snapshot** in the top bar saves the current frame as a PNG image at full resolution, for thumbnails and posters.

---

## 17. Saving, opening and reconnecting projects

### Automatic saving

Your work is saved automatically in the app as you edit. If you close the app and open it again, your last project comes back.

### Project files

- **Save** (Ctrl + S) downloads a `.akks.json` project file.
- **Open** (Ctrl + O) opens one. You can also drop a project file onto the stage.

**What's inside a project file:** all your edits, text, settings, colour choices and **photos** (clips, overlays and background images).

**What isn't inside:** **videos and music**, because they're usually too large. The project remembers each file's name instead.

### Reconnecting media ("Missing media")

When you open a project on another day or another computer, videos and music show as **offline**. To bring them back:

1. Click an empty part of the stage to see the **Project** panel.
2. Under **Missing media**, click **Find the files…**.
3. Select all the listed files at once (hold Ctrl to pick several). Each is matched by its file name, and everything reconnects with all your edits.

Importing a missing file the normal way reconnects it too.

**Tip:** keep each project's videos, music and voiceover recordings in one folder with the project file. Don't rename them.

### Undo and redo

**Ctrl + Z** undoes, and **Ctrl + Shift + Z** (or **Ctrl + Y**) redoes, up to 150 steps.

---

## 18. Keyboard shortcuts

| Key | Action |
| --- | --- |
| **Space** | Play / pause |
| **← / →** | Step one frame back / forward |
| **Shift + ← / →** | Jump one second |
| **Home / End** | Go to the start / end |
| **I / O** | Set the clip's in / out point at the playhead |
| **S** | Split the selected clip, layer or audio track at the playhead |
| **T** | Add a text layer |
| **R** | Start / stop recording a voiceover |
| **Ctrl + D** | Duplicate the selected item |
| **Delete** | Delete the selected item |
| **Ctrl + I** | Import videos, photos or music |
| **Ctrl + Z** | Undo |
| **Ctrl + Shift + Z** or **Ctrl + Y** | Redo |
| **Ctrl + S** | Save the project |
| **Ctrl + O** | Open a project |
| **Ctrl + E** | Export video |
| **L** | Loop playback on / off |
| **G** | Guides on / off |
| **M** | Mute everything |
| **F** | Full screen |
| **Esc** | Deselect (shows the Project panel) |
| **?** | Show all shortcuts |
| **Ctrl + mouse wheel** on the timeline | Zoom the timeline |
| **Mouse wheel** over an overlay | Resize the selected overlay |
| **Alt** while dragging | Move text or overlays without centre snapping |

---

## 19. Step-by-step recipes

### A. Photo slideshow with music

1. **Import media** → select all your photos at once.
2. Select the first photo clip, open **Motion** and choose **Slow zoom in (Ken Burns)**. Give other photos **Slow zoom out** or pans for variety.
3. Click the first **+** marker between clips, choose **Cross dissolve**, then click **Use on every cut**.
4. **Import media** → your song. Select the track and click **End with the video**.
5. Change the title text, or set the Background to **None** and add a **Typewriter caption**.
6. **Export video**.

### B. Vertical Reel from a landscape video

1. In the **Project** panel, set **Aspect ratio** to **9:16**.
2. Import your video. Select the clip and, in **Framing**, choose **Fit**.
3. Select **Background** and choose **Blur**. A blurred copy of the video fills the empty space above and below.
4. Change the title text's **Fill mode** to **Solid** for easy-to-read captions.

### C. Credits roll at the end

1. Choose **＋ Add → Colour clip** (black), then set its **Duration** to 10 seconds.
2. **Text preset… → Credits roll (scroll up)** and type your names.
3. In the text's **Timing**, set it to start where the colour clip starts (move the playhead there and click **Start at playhead**).

### D. Logo watermark in the corner

1. **＋ Add → Overlay** and choose your logo (a transparent PNG is best).
2. Click **↘** in Size and position, and lower **Size** to about 12 %.
3. Set **Opacity** to about 70 % and click **Full length** in Timing.

### E. Green-screen effect

1. Put your background footage on the video track.
2. **＋ Add → Overlay** and choose the green-screen video.
3. Click **Full screen** in Size and position, then open **Remove background**, tick it and click **Green**.
4. Adjust **Strength** and **Edge softness** until the edges look clean.

### F. Tutorial with voiceover

1. Import your screen recording.
2. Plug in headphones and move the playhead to the start.
3. Press **R**, talk while it plays, and press **R** to stop.
4. Import music, set its volume to about 25 %, and tick **Repeat until the video ends**.

### G. Slow-motion highlight

1. Move the playhead to where the action starts and press **S**. Move to where it ends and press **S** again.
2. Select the middle piece and click **0.25×**.
3. Add **Dip to black** or **Flash** transitions on either side for drama.

---

## 20. Troubleshooting and questions

**My video won't import ("This browser can't play…").**
Convert it to MP4 (H.264) or WebM, for example with the free HandBrake app. MP4 and WebM always work; MOV, MKV and HEVC depend on your computer.

**Playback stutters.**
In the Project panel, set **Preview quality** to **Half**. This doesn't affect the exported video. Closing other heavy programs helps too.

**The video looks black; I only see the text.**
That's the knockout effect: the Background covers the video. Select **Background** and choose **None** to see the whole video.

**My text is invisible.**
With **Video in text** mode and Background **None**, the text shows the same video it sits on. Choose **Solid** fill mode, or set a background.

**Clips say "offline" or "Media offline".**
The project was opened without its video or music files. Use **Find the files…** in the Project panel (section 17).

**Export is slower than I expected.**
High-quality mode renders every frame exactly, which can take longer than the video, especially at 4K. Export at Full HD first, close other programs, or use **Real-time recording**.

**The export window doesn't list H.264.**
Your browser can't encode H.264 on this computer. Use the Windows app, Chrome or Edge, or choose AV1 or VP9 (YouTube and modern phones play them).

**The exported WebM from real-time mode shows no length in some players.**
That's a known limit of browser recording. Use High quality mode, or choose MP4.

**The microphone doesn't work.**
Allow microphone access when asked. On Windows, also check **Settings → Privacy & security → Microphone** and make sure apps are allowed to use it.

**Fonts look different.**
The built-in fonts load from the internet the first time. Connect to the internet once, then open the editor again.

**Can I use it on my phone?**
The online version works on phones and tablets for small edits, but a computer is much more comfortable for editing and exporting.

**Is my video uploaded anywhere?**
No. Everything happens on your computer. The only thing downloaded from the internet is the set of fonts.

---

## 21. What the editor does not do

Honest limits, so you know what to expect:

- **Upscaling is not AI.** It uses high-quality resizing plus sharpening. Text and graphics are truly sharp at 4K; footage can't gain detail it never had.
- **No AI features** such as automatic captions, AI background removal (the green-screen tool works on solid-coloured backgrounds only) or AI voice effects.
- **No reverse playback** (playing a clip backwards).
- **No keyframe animation** of clip settings over time; use Motion, transitions and the text and overlay animations instead.
- **Speed changes keep one speed per clip.** To speed up part of a clip, split it first. In high-quality exports, the sound of a sped-up clip changes pitch.
- **Videos and music aren't stored inside project files.** Keep them with the project (section 17).
- **High-quality export can take longer than the video's length**, depending on your computer and resolution.

---

*AK Knockout Studio 2 · Made by AJAIKRISHNA · Free for everyone.*
