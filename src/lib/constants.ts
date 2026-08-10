/**
 * Shared application constants.
 * To track a different campaign, update KARSEELL_CAMPAIGN_ID here
 * or set VITE_META_CAMPAIGN_ID in your .env file.
 */

/** The primary Karseell campaign being tracked */
export const KARSEELL_CAMPAIGN_ID =
  (import.meta.env.VITE_META_CAMPAIGN_ID as string | undefined) ??
  "120252073443580166";
