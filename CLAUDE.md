@AGENTS.md

# Listen

Personal iOS music player (YouTube Music search, streaming, downloads, playlists, queue). iPhone only, installed through TestFlight; Android is not a target. See README.md for features and structure.

## Commands

- `npm start`: dev server for the Listen dev build. Never suggest plain `npx expo start`: it opens Expo Go, where the fonts and native modules are missing and icons render as their names.
- `npx expo run:ios`: needed after any native dependency or `app.json` plugin change.
- After a native package version change, restart Metro with `--clear`; a stale cache causes errors such as the Worklets version mismatch.
- Run `npx tsc --noEmit` and `npx expo lint` before calling a change done.

## Where things live

- `src/yt.ts`: every YouTube call. Keep it that way so YouTube breakage stays in one file.
- `src/player.tsx`: `PlayerProvider` (expo-audio player, queue, auto-advance).
- `src/library.tsx`: `LibraryProvider` (SQLite schema, downloads, playlists, likes).
- `src/songMenu.ts` + `src/app/song-menu.tsx`: the song actions sheet, opened through route params.
- `src/widgets/`: the Home Screen widget (expo-widgets). `NowPlaying.tsx` is the layout; the player calls `updateNowPlayingWidget` on every song change.
- `src/homeFeed.ts`: 6-hour cache for Home (charts, related songs) in the key-value store.
- `listen.pen`: the pen.dev design. `src/theme.ts` mirrors its variables; read the design with the pencil MCP tools, never with Read.

## Traps

- **YouTube client**: audio URLs must come from the `VISIONOS` InnerTube client; other clients need PO tokens or return 403 partway through a track. Don't set `generate_session_locally` (VISIONOS rejects local visitor data), and keep `retrieve_player: false`.
- **Download speed**: downloads need `headers: { Range: 'bytes=0-' }`, or YouTube throttles them to playback speed.
- **Double duration**: YouTube's fragmented m4a files make AVPlayer report twice the length and play silence past the end. Downloaded files are repaired by `fixDurationHeader` in `library.tsx`. Streams use `streamDuration` from the player context; UI code must prefer it over `status.duration`.
- **File paths**: locate downloaded files by song id (`songs/<id>.m4a`), never by a stored absolute URI; the app container path changes on reinstall. Store remote artwork URLs in the DB for the same reason (`remoteArtwork`).
- **Fonts**: reference fonts by PostScript name (`fonts` in `theme.ts`); `fontWeight` won't select Inter weights on iOS. Icons are Material Symbols ligatures through `<Icon name="…" />`. The font only has outline glyphs, so filled icons need an SVG (see `LikeButton.tsx`).
- **Imports**: import `Tabs` from `expo-router/js-tabs`; the `expo-router` export is deprecated.
- **Reanimated**: use `sharedValue.get()` / `.set()`, not `.value`; the React Compiler lint rule rejects `.value` writes.
- **Queue model**: `songs` is what the user chose or queued; `autoplay` is YouTube Music radio appended when `songs` runs out. Autoplay songs move into `songs` as they start. Repeat-all loops `songs` and never fetches autoplay.
- **Widget function**: the `'widget'` function in `src/widgets/NowPlaying.tsx` is compiled into the extension separately. It can't reference module-level constants, imports beyond `@expo/ui`, hooks, or async code; pass everything through props. Artwork must be copied into `widgetsDirectory` (the App Group) first.
- **Plugin order**: `./plugins/withoutPushEntitlement` must stay listed before `expo-widgets` in `app.json`. expo-widgets always adds `aps-environment`, and entitlement mods run in reverse order.
- **Build number**: bump `ios.buildNumber` in `app.json` and re-run prebuild before each TestFlight archive; the widget extension copies it at prebuild time.
- **ReorderableList**: rows must match `rowHeight` exactly, and rows inside `SwipeToRemove` need an opaque background (`ListRow` has one).
