# Listen

A personal iPhone music player: search YouTube Music, stream songs, download them for offline listening, and organise them into playlists. Built with Expo and React Native, installed on one device through TestFlight.

> Personal project, not for distribution. Downloading from YouTube is against YouTube's Terms of Service.

## Features

- **Search** YouTube Music for songs; results show the official album audio.
- **Stream** audio-only AAC (about 1 MB per minute), with background playback, lock-screen and Dynamic Island controls.
- **Download** songs for offline playback. Downloaded songs always play from the device.
- **Like** songs and browse them in Liked Songs.
- **Playlists** with artwork collages, drag to reorder, swipe to remove.
- **Queue** with Up Next, Play Next / Add to Queue, shuffle, and auto-advance.
- **Offline mode**: songs that aren't downloaded are dimmed when there's no connection.

## Tech stack

| Area | Library |
| --- | --- |
| App framework | Expo SDK 57, React Native 0.86, TypeScript |
| Navigation | Expo Router (tabs, stacks, native sheets) |
| YouTube | [youtubei.js](https://github.com/LuanRT/YouTube.js) (InnerTube, no API key) |
| Playback | expo-audio |
| Downloads | expo-file-system (background download tasks) |
| Storage | expo-sqlite (library, playlists, likes) and its key-value store (settings) |
| Gestures | react-native-gesture-handler, react-native-reanimated |
| Design | [pen.dev](https://pen.dev) file: `listen.pen` |

## Getting started

Requirements: a Mac with Xcode, and Node.js LTS (22 or 24).

```sh
npm install
npx expo run:ios      # builds the native app and opens it in the iOS Simulator
```

After that first build, day-to-day development only needs the dev server:

```sh
npm start             # then press i to open the app in the Simulator
```

`npm start` runs `expo start --dev-client`, which opens **your own Listen build**. Plain `npx expo start` opens Expo Go instead, which can't load this app's fonts or native modules.

### When to rebuild

Run `npx expo run:ios` again after adding or upgrading a package that contains native code, or after changing `app.json` plugins. If Metro shows stale-code errors after a package change, restart it with `npx expo start --dev-client --clear`.

### Checks

```sh
npx tsc --noEmit      # typecheck
npx expo lint         # lint
```

### Run on an iPhone

Plug the phone in, turn on Developer Mode (Settings → Privacy & Security), then:

```sh
npx expo run:ios --device
```

## Project structure

```
src/
  app/                 Expo Router routes (every file is a screen)
    (tabs)/            Search, Library, Settings tabs
      library/         Library stack: index, liked, playlist/[id]
    player.tsx         Now Playing (modal)
    queue.tsx          Queue (sheet)
    song-menu.tsx      Song actions menu (sheet)
  components/          Shared UI (SongRow, MiniPlayer, ReorderableList, …)
  yt.ts                YouTube search and audio URLs
  player.tsx           Playback state and queue (PlayerProvider)
  library.tsx          Downloads, playlists, likes (LibraryProvider, SQLite)
  theme.ts             Colours and fonts, matching the variables in listen.pen
assets/fonts/          Material Symbols Rounded icon font
listen.pen             UI design (open with pen.dev)
```

## How it works

1. **Search**: `yt.music.search()` returns songs from YouTube Music.
2. **Audio URL**: `getBasicInfo(id, { client: 'VISIONOS' })` returns a plain audio-only m4a URL. The URL expires after a few hours, so it's fetched right before each play or download.
3. **Play**: expo-audio streams the URL, or plays the local file if the song is downloaded.
4. **Download**: expo-file-system saves the m4a and its artwork to the app's documents folder. The song's details go into SQLite.

YouTube's audio files need two workarounds, both documented in the code:

- Downloads must send a `Range: bytes=0-` header; otherwise YouTube throttles them to playback speed.
- The files store their length twice, and Apple's player adds the two, reporting double the duration and playing silence past the end. Downloaded files get their header repaired, and streams use YouTube's own duration.

If YouTube changes something and playback breaks, the fix almost always belongs in `src/yt.ts`: update `youtubei.js` first.

## Roadmap

- [x] Search, streaming, Now Playing
- [x] Downloads and offline playback
- [x] Likes, playlists, queue
- [ ] Settings: Wi-Fi-only downloads, storage, Import from Files
- [ ] TestFlight build
- [ ] Spotify playlist import
- [ ] Next/previous on the lock screen and Dynamic Island
