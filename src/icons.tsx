const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function PlayIcon() {
  return (
    <svg {...base} fill="currentColor" stroke="none">
      <path d="M6 4.5a1.5 1.5 0 0 1 2.28-1.28l11 7a1.5 1.5 0 0 1 0 2.56l-11 7A1.5 1.5 0 0 1 6 19.5z" />
    </svg>
  )
}

export function PauseIcon() {
  return (
    <svg {...base} fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1.4" />
      <rect x="14" y="4" width="4" height="16" rx="1.4" />
    </svg>
  )
}

export function SkipIcon() {
  return (
    <svg {...base}>
      <path d="M5 5v14l10-7z" fill="currentColor" stroke="none" />
      <path d="M18 5v14" />
    </svg>
  )
}

export function VideoIcon() {
  return (
    <svg {...base}>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="M15.5 10.5 21 7.5v9l-5.5-3z" />
    </svg>
  )
}

export function VideoOffIcon() {
  return (
    <svg {...base}>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="M15.5 10.5 21 7.5v9l-5.5-3z" />
      <path d="M3 21 21 3" />
    </svg>
  )
}

export function SoundIcon() {
  return (
    <svg {...base}>
      <path d="M4 9.5h3l4.5-3.8v12.6L7 14.5H4z" />
      <path d="M16 9.2a4 4 0 0 1 0 5.6" />
      <path d="M18.8 6.4a8 8 0 0 1 0 11.2" />
    </svg>
  )
}

export function MutedIcon() {
  return (
    <svg {...base}>
      <path d="M4 9.5h3l4.5-3.8v12.6L7 14.5H4z" />
      <path d="m16.5 10 4 4" />
      <path d="m20.5 10-4 4" />
    </svg>
  )
}
