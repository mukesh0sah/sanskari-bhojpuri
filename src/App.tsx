import { BannerAd } from './BannerAd'
import {
  MutedIcon,
  PauseIcon,
  PlayIcon,
  SkipIcon,
  SoundIcon,
  VideoIcon,
  VideoOffIcon,
} from './icons'
import { CONTACT_EMAIL } from './config'
import { useRadio } from './useRadio'
import { useVisitCount } from './useVisitCount'
import { useState } from 'react'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  return `${mins}:${String(total % 60).padStart(2, '0')}`
}

function statusLabel(radio: ReturnType<typeof useRadio>): string {
  if (radio.status === 'error') return 'Station off air'
  if (radio.status === 'loading') return 'Tuning in…'
  if (radio.awaitingSound) return 'Tap anywhere for sound'
  return radio.isPlaying ? 'On air' : 'Paused'
}

function formatVisits(count: number): string {
  return count.toLocaleString('en-IN')
}

export default function App() {
  const radio = useRadio()
  const visits = useVisitCount()
  const [showVideo, setShowVideo] = useState(false)

  const progress = radio.duration > 0 ? (radio.currentTime / radio.duration) * 100 : 0

  return (
    <main className="stage">
      <img className="stage__art" src="/backdrop.jpg" alt="" width={1536} height={1024} />
      <div className="stage__vignette" aria-hidden="true" />
      <div className="stage__grain" aria-hidden="true" />

      <BannerAd />

      <header className="topbar">
        <span className="visits" aria-live="polite">
          {visits === null ? (
            <span className="visits__placeholder">—</span>
          ) : (
            <>
              <span className="visits__count">{formatVisits(visits)}</span>
              <span className="visits__label">visits</span>
            </>
          )}
        </span>
        <span className="onair" role="status">
          <span className={`onair__dot ${radio.isPlaying ? 'onair__dot--live' : ''}`} />
          {radio.isPlaying ? 'live' : 'standby'}
        </span>
      </header>

      <div className="wordmark">
        <h1>
          <span>भोजपुरी</span>
          <span>रेडियो</span>
        </h1>
        <p>Bhojpuri Radio · open all hours</p>
      </div>

      <div className="stage__fill" />

      <div className="dock">
        {/* The player must stay mounted at all times: unmounting it would stop
            the stream, so the closed state only collapses it visually. */}
        <div className={`screen ${showVideo ? 'screen--open' : ''}`} aria-hidden={!showVideo}>
          <div className="screen__frame">
            <div className="screen__player" ref={radio.mountRef} />
            {/* Swallows clicks so the embed can never navigate out to YouTube. */}
            <div className="screen__shield" />
          </div>
        </div>

        <div className="bar">
          <div className={`disc ${radio.isPlaying ? 'disc--spinning' : ''}`} aria-hidden="true">
            <span className="disc__label" />
          </div>

          <div className="bar__meta">
            <p className="bar__status">{statusLabel(radio)}</p>
            <p className="bar__station" title={radio.trackTitle || undefined}>
              {radio.trackTitle || 'Tuning in…'}
            </p>
            <div className="bar__progress">
              <span className="track" style={{ ['--progress' as string]: `${progress}%` }} />
              <span className="bar__time">
                {formatTime(radio.currentTime)} / {formatTime(radio.duration)}
              </span>
            </div>
          </div>

          <div className="bar__controls">
            <button
              type="button"
              className="btn btn--play"
              onClick={radio.togglePlay}
              disabled={radio.status !== 'ready'}
              aria-label={radio.isPlaying ? 'Pause' : 'Play'}
            >
              {radio.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              className="btn"
              onClick={radio.skip}
              disabled={radio.status !== 'ready'}
              aria-label="Next track"
            >
              <SkipIcon />
            </button>
            <button
              type="button"
              className={`btn ${showVideo ? 'btn--on' : ''}`}
              onClick={() => setShowVideo((open) => !open)}
              disabled={radio.status !== 'ready'}
              aria-pressed={showVideo}
              aria-label={showVideo ? 'Hide the video' : 'Show the video'}
            >
              {showVideo ? <VideoOffIcon /> : <VideoIcon />}
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={radio.toggleMute}
              disabled={radio.status !== 'ready'}
              aria-label={radio.isMuted ? 'Unmute' : 'Mute'}
            >
              {radio.isMuted ? <MutedIcon /> : <SoundIcon />}
            </button>
          </div>
        </div>

        <a className="dock__contact" href={`mailto:${CONTACT_EMAIL}`}>
          contact: {CONTACT_EMAIL}
        </a>
      </div>
    </main>
  )
}
