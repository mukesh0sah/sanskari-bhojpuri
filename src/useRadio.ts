import { useCallback, useEffect, useRef, useState } from 'react'
import { AUTOPLAY_GRACE_MS, PLAYLIST_ID } from './config'
import { loadYouTubeApi, PlayerState, type YTPlayer } from './youtube'

const MAX_CONSECUTIVE_ERRORS = 4
const PROGRESS_POLL_MS = 500
/** Grace period to let YouTube advance a finished playlist by itself. */
const ADVANCE_GRACE_MS = 1200

export interface RadioState {
  status: 'loading' | 'ready' | 'error'
  isPlaying: boolean
  isMuted: boolean
  /** True when autoplay was only allowed muted and a tap is needed for sound. */
  awaitingSound: boolean
  /** Current track title from YouTube, cleaned for the player bar. */
  trackTitle: string
  currentTime: number
  duration: number
}

/**
 * YouTube Bhojpuri uploads often start with `#Video | Song Name | …`. Prefer the
 * song segment when that pattern is present; otherwise keep the raw title.
 */
export function cleanTrackTitle(raw: string): string {
  const parts = raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length >= 2 && /^#?\s*video$/i.test(parts[0])) return parts[1]
  return raw.trim()
}

function readTrackTitle(player: YTPlayer): string {
  try {
    const title = player.getVideoData()?.title
    return title ? cleanTrackTitle(title) : ''
  } catch {
    return ''
  }
}

export interface Radio extends RadioState {
  /** Attach point for the player iframe. Must stay mounted for playback to survive. */
  mountRef: React.RefObject<HTMLDivElement | null>
  togglePlay: () => void
  skip: () => void
  toggleMute: () => void
}

export function useRadio(): Radio {
  const mountRef = useRef<HTMLDivElement | null>(null)
  /** Only set once onReady has fired: the API attaches its methods lazily. */
  const playerRef = useRef<YTPlayer | null>(null)
  /** Set immediately so the player can always be torn down, ready or not. */
  const instanceRef = useRef<YTPlayer | null>(null)
  const awaitingSoundRef = useRef(false)
  /** Set when the listener pauses on purpose, so returning does not override it. */
  const userPausedRef = useRef(false)
  const errorCountRef = useRef(0)
  /** Track count is needed to pick a random position if the station stalls. */
  const sourceTracksRef = useRef<string[]>([])

  const [state, setState] = useState<RadioState>({
    status: 'loading',
    isPlaying: false,
    isMuted: false,
    awaitingSound: false,
    trackTitle: '',
    currentTime: 0,
    duration: 0,
  })

  useEffect(() => {
    let disposed = false
    let autoplayTimer: number | undefined
    const host = mountRef.current
    if (!host) return

    // The API replaces the element it is handed, so give it a throwaway child
    // rather than the ref node itself.
    const target = document.createElement('div')
    host.appendChild(target)

    /**
     * Verifies that playback actually began, and falls back to muted playback
     * when the browser refused unmuted autoplay.
     */
    const verifyAutoplay = (player: YTPlayer) => {
      window.clearTimeout(autoplayTimer)
      autoplayTimer = window.setTimeout(() => {
        if (disposed) return
        const state = player.getPlayerState()
        if (state === PlayerState.PLAYING || state === PlayerState.BUFFERING) return
        // Muted autoplay is still permitted, so keep the stream rolling and
        // wait for a gesture to bring the sound up.
        player.mute()
        player.playVideo()
        awaitingSoundRef.current = true
        setState((prev) => ({ ...prev, awaitingSound: true, isMuted: true }))
      }, AUTOPLAY_GRACE_MS)
    }

    /**
     * A player bound to a `list` parameter ignores `loadPlaylist`, so the order
     * cannot be replaced from here. Instead the player shuffles its own copy of
     * the playlist and we drop into it at a random position, which gives every
     * visitor a different starting track.
     */
    const startShuffled = (player: YTPlayer, attempt = 0) => {
      const tracks = player.getPlaylist()

      if (!tracks || tracks.length === 0) {
        // The playlist is fetched asynchronously and lags behind onReady.
        if (attempt < 8) {
          window.setTimeout(() => {
            if (!disposed) startShuffled(player, attempt + 1)
          }, 300)
          return
        }
        player.playVideo()
        verifyAutoplay(player)
        return
      }

      sourceTracksRef.current = tracks
      if (tracks.length === 1) player.playVideo()
      else {
        player.setShuffle(true)
        player.playVideoAt(Math.floor(Math.random() * tracks.length))
      }
      verifyAutoplay(player)
    }

    /**
     * ENDED can mean either "this track finished and YouTube will advance" or
     * "the playlist ran out", so give YouTube a moment before intervening to
     * avoid skipping a track.
     */
    const handleEnded = (player: YTPlayer) => {
      const indexAtEnd = player.getPlaylistIndex()
      window.setTimeout(() => {
        if (disposed) return
        if (player.getPlayerState() !== PlayerState.ENDED) return
        if (player.getPlaylistIndex() !== indexAtEnd) return

        const tracks = sourceTracksRef.current
        if (tracks.length > 1) player.playVideoAt(Math.floor(Math.random() * tracks.length))
        else player.playVideo()
      }, ADVANCE_GRACE_MS)
    }

    loadYouTubeApi()
      .then((YT) => {
        if (disposed) return

        const player = new YT.Player(target, {
          playerVars: {
            listType: 'playlist',
            list: PLAYLIST_ID,
            // Cue only. The embed's own autoplay races the random track we pick
            // in onReady and wins, which pins every visit to track one.
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            // Hide annotations and keep suggestions inside the same channel so no
            // track titles leak into the frame when the video is revealed.
            iv_load_policy: 3,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target: player }) => {
              if (disposed) return
              playerRef.current = player
              // Keeps the station playing even if the ENDED handler is missed.
              player.setLoop(true)
              startShuffled(player)
              setState((prev) => ({ ...prev, status: 'ready', isMuted: player.isMuted() }))
            },
            onStateChange: ({ target: player, data }) => {
              if (disposed) return
              if (data === PlayerState.PLAYING) errorCountRef.current = 0
              if (data === PlayerState.ENDED) {
                handleEnded(player)
                return
              }
              const trackTitle = readTrackTitle(player)
              setState((prev) => ({
                ...prev,
                isPlaying: data === PlayerState.PLAYING || data === PlayerState.BUFFERING,
                trackTitle: trackTitle || prev.trackTitle,
              }))
            },
            onError: ({ target: player }) => {
              if (disposed) return
              errorCountRef.current += 1
              if (errorCountRef.current > MAX_CONSECUTIVE_ERRORS) {
                setState((prev) => ({ ...prev, status: 'error', isPlaying: false }))
                return
              }
              player.nextVideo()
            },
          },
        })

        instanceRef.current = player
      })
      .catch(() => {
        if (!disposed) setState((prev) => ({ ...prev, status: 'error' }))
      })

    return () => {
      disposed = true
      window.clearTimeout(autoplayTimer)
      if (typeof instanceRef.current?.destroy === 'function') instanceRef.current.destroy()
      instanceRef.current = null
      playerRef.current = null
      // `destroy` does not exist until the player is ready and the API swaps out
      // the element it was handed, so clear the host to be sure no iframe (and
      // no audio) survives an early unmount.
      host.replaceChildren()
    }
  }, [])

  // Unmute on the first gesture once muted fallback playback has kicked in.
  useEffect(() => {
    if (!state.awaitingSound) return

    const enableSound = () => {
      const player = playerRef.current
      if (!player) return
      player.unMute()
      player.playVideo()
      awaitingSoundRef.current = false
      setState((prev) => ({ ...prev, awaitingSound: false, isMuted: false }))
    }

    window.addEventListener('pointerdown', enableSound, { once: true })
    window.addEventListener('keydown', enableSound, { once: true })
    return () => {
      window.removeEventListener('pointerdown', enableSound)
      window.removeEventListener('keydown', enableSound)
    }
  }, [state.awaitingSound])

  /*
   * Mobile browsers pause the YouTube embed as soon as the tab is backgrounded
   * or the screen locks, and that cannot be prevented from here. The next best
   * thing is to pick the station back up the moment the listener returns, unless
   * they had paused it deliberately.
   */
  useEffect(() => {
    if (state.status !== 'ready') return
    let resumeTimer: number | undefined

    const resumeIfVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (userPausedRef.current) return
      window.clearTimeout(resumeTimer)
      // The embed needs a beat after the tab is shown before it accepts play().
      resumeTimer = window.setTimeout(() => {
        const player = playerRef.current
        if (!player) return
        const playerState = player.getPlayerState()
        if (playerState === PlayerState.PLAYING || playerState === PlayerState.BUFFERING) return
        player.playVideo()
      }, 350)
    }

    document.addEventListener('visibilitychange', resumeIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', resumeIfVisible)
      window.clearTimeout(resumeTimer)
    }
  }, [state.status])

  useEffect(() => {
    if (state.status !== 'ready') return
    const id = window.setInterval(() => {
      const player = playerRef.current
      if (!player) return
      const duration = player.getDuration()
      const currentTime = player.getCurrentTime()
      const trackTitle = readTrackTitle(player)
      setState((prev) => {
        const nextTitle = trackTitle || prev.trackTitle
        if (
          prev.currentTime === currentTime &&
          prev.duration === duration &&
          prev.trackTitle === nextTitle
        ) {
          return prev
        }
        return { ...prev, currentTime, duration, trackTitle: nextTitle }
      })
    }, PROGRESS_POLL_MS)
    return () => window.clearInterval(id)
  }, [state.status])

  const togglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (awaitingSoundRef.current) {
      player.unMute()
      awaitingSoundRef.current = false
      setState((prev) => ({ ...prev, awaitingSound: false, isMuted: false }))
    }
    if (player.getPlayerState() === PlayerState.PLAYING) {
      userPausedRef.current = true
      player.pauseVideo()
    } else {
      userPausedRef.current = false
      player.playVideo()
    }
  }, [])

  const skip = useCallback(() => {
    playerRef.current?.nextVideo()
  }, [])

  const toggleMute = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    const muted = player.isMuted()
    if (muted) player.unMute()
    else player.mute()
    awaitingSoundRef.current = false
    setState((prev) => ({ ...prev, isMuted: !muted, awaitingSound: false }))
  }, [])

  return { ...state, mountRef, togglePlay, skip, toggleMute }
}
