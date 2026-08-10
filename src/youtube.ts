const API_SRC = 'https://www.youtube.com/iframe_api'

export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  nextVideo(): void
  mute(): void
  unMute(): void
  isMuted(): boolean
  setLoop(loop: boolean): void
  setShuffle(shuffle: boolean): void
  getPlaylist(): string[] | null
  getPlaylistIndex(): number
  playVideoAt(index: number): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  getVideoData(): { title?: string; video_id?: string; author?: string }
  getIframe(): HTMLIFrameElement
  destroy(): void
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      playerVars?: Record<string, string | number>
      events?: {
        onReady?: (event: { target: YTPlayer }) => void
        onStateChange?: (event: { target: YTPlayer; data: number }) => void
        onError?: (event: { target: YTPlayer; data: number }) => void
      }
    },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTNamespace> | null = null

/**
 * The IFrame API is a global singleton that signals readiness by calling
 * `window.onYouTubeIframeAPIReady`, so the script may only ever be injected once
 * per page and any pre-existing callback has to be preserved.
 */
export function loadYouTubeApi(): Promise<YTNamespace> {
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }

    const previousCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube player API loaded without a Player constructor'))
    }

    if (document.querySelector(`script[src="${API_SRC}"]`)) return

    const script = document.createElement('script')
    script.src = API_SRC
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('Could not reach the YouTube player API'))
    }
    document.head.appendChild(script)
  })

  return apiPromise
}
