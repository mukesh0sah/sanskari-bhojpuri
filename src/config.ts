/**
 * Public YouTube playlist that feeds the station. Tracks are read live from
 * YouTube, so adding or removing songs on the playlist changes what the site
 * plays without a redeploy. The playlist must stay public or unlisted.
 */
export const PLAYLIST_ID = 'PLd3Xm1tQ0C8U'

/**
 * Browsers only allow unmuted playback after a user gesture. We optimistically
 * try it on load and fall back to muted playback if the player has not started
 * within this window.
 */
export const AUTOPLAY_GRACE_MS = 1600

export const CONTACT_EMAIL = 'mukeshsah707@gmail.com'
