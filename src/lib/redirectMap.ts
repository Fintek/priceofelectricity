// Future-proofing for slug migrations or URL restructuring.
// When a slug changes or a page moves, add the old path as the key
// and the new path as the value. The middleware issues a 308 redirect
// for any matching entry before other normalization rules run.
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/dc": "/district-of-columbia",
  "/washington-dc": "/district-of-columbia",
  "/washington-d-c": "/district-of-columbia",
  "/district-of-colombia": "/district-of-columbia",
};
