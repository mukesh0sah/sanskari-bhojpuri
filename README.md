# भोजपुरी रेडियो

An always-on radio site: it streams a YouTube playlist over a painted village
street-corner scene. Song titles are never shown, the running order is
randomised, and the video itself is hidden behind a single toggle.

## How it works

The audio comes from a real YouTube embed (the IFrame Player API) that is parked
off-screen at a normal size. Pressing the video button moves that same iframe
into a panel above the controls, so revealing or hiding the video never
interrupts playback.

Tracks are read live from the playlist, so **adding or removing songs on YouTube
changes the station without a redeploy**. The playlist has to stay public or
unlisted. The playlist is set in one place:

```1:6:src/config.ts
export const PLAYLIST_ID = 'PLd3Xm1tQ0C8U'
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the production build locally
```

Node 20 or newer is recommended.

Note: this project pins the public npm registry in `.npmrc`, because the machine
it was set up on defaults to a private corporate registry.

## Visit counter

The top-left visit total is stored in **Netlify Blobs** and served by
`netlify/functions/visits.mts` at `/api/visits`. Each browser session is counted
once (refreshing the page does not bump the number again). The counter only
works after a Netlify deploy — local `npm run dev` will show a dash.

## Deploying

Configured for Netlify via `netlify.toml` (build `npm run build`, publish `dist`).
Redeploy so `/api/visits` ships with the site. On other static hosts the radio
still works, but the visit counter needs an equivalent backend.

## Things worth knowing

- **Sound cannot always start on its own.** Browsers refuse unmuted autoplay
  until the visitor interacts with the page. The player detects this, keeps
  playing muted, and shows "Tap anywhere for sound"; the first tap or keypress
  brings the sound up. This is a browser rule, not something the site can
  bypass.
- **Ads are outside the site's control.** They are served by YouTube inside the
  embed. Monetised uploads may show them; nothing here can suppress them.
- **Titles are hidden, not secret.** The player chrome is turned off so no title
  is drawn on screen, and clicks on the video panel are swallowed so it cannot
  navigate out to YouTube. The video IDs are still visible to anyone who opens
  browser devtools, which is unavoidable with an embed.
- Hiding the YouTube player is at odds with the YouTube API Terms of Service.
  Plenty of sites do it, but it is worth knowing before promoting the site
  widely.

## Layout

| Path                           | Purpose                                                    |
| ------------------------------ | ---------------------------------------------------------- |
| `src/config.ts`                | Playlist ID, contact email, autoplay timing                |
| `src/youtube.ts`               | Loads the IFrame Player API and types the player methods   |
| `src/useRadio.ts`              | Playback: random start, autoplay fallback, error recovery  |
| `src/useVisitCount.ts`         | Fetches / increments the Netlify visit total               |
| `src/App.tsx`                  | The scene, the control bar, and the video reveal           |
| `netlify/functions/visits.mts` | Visit counter API backed by Netlify Blobs                  |
| `public/`                      | Background illustration                                    |
# sanskari-bhojpuri
