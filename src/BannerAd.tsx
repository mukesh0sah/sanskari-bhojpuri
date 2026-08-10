import { useEffect, useRef } from 'react'
import { ADSENSE_BANNER_SLOT, ADSENSE_CLIENT } from './config'

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

/**
 * Fixed top banner. Reserves height so the wordmark stays clear of the ad.
 * Pushes into `adsbygoogle` once per mount; Strict Mode remounts are guarded
 * by the filled attribute AdSense sets on the <ins>.
 */
export function BannerAd() {
  const pushed = useRef(false)

  useEffect(() => {
    if (!ADSENSE_BANNER_SLOT || pushed.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushed.current = true
    } catch {
      // Ad blockers / missing script should not break the radio.
    }
  }, [])

  return (
    <div className="adband" aria-label="Advertisement">
      <div className="adband__inner">
        {ADSENSE_BANNER_SLOT ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={ADSENSE_BANNER_SLOT}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        ) : (
          <span className="adband__fallback">Advertisement</span>
        )}
      </div>
    </div>
  )
}
