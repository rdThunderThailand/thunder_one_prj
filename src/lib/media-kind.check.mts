import assert from "node:assert";
import { isVideoUrl } from "./media-kind.ts";

// The bug this guards: a signed URL for an .mp4 cover reached next/image and the optimizer
// returned 500. Real URL shape, token and all.
{
  const signedMp4 =
    "https://sfiefevtxalqjizdkcsw.supabase.co/storage/v1/object/sign/media/videos/db2b1bcf-d385-4ce9-bcf8-8a6b463f7aeb.mp4?token=eyJhbGciOiJIUzI1NiJ9.abc";
  assert.strictEqual(isVideoUrl(signedMp4), true);
}

// .mov is in prod too (video/quicktime), so it must not fall through to next/image either.
{
  const signedMov =
    "https://sfiefevtxalqjizdkcsw.supabase.co/storage/v1/object/sign/media/videos/bb0685b6-9abd-432c-9d0a-6f8ac2738620.mov?token=x";
  assert.strictEqual(isVideoUrl(signedMov), true);
}

// Images live under the same `videos/` prefix — the folder must not be what decides.
{
  const signedPng =
    "https://sfiefevtxalqjizdkcsw.supabase.co/storage/v1/object/sign/media/videos/5d779c41-fea4-4a69-a80e-0bdcf6750603.png?token=x";
  const signedWebp =
    "https://sfiefevtxalqjizdkcsw.supabase.co/storage/v1/object/sign/media/videos/cf405f9d-3cff-45b2-8b11-326db27e58d7.webp?token=x";
  assert.strictEqual(isVideoUrl(signedPng), false);
  assert.strictEqual(isVideoUrl(signedWebp), false);
}

// "videos" appearing in the path must not be mistaken for an extension match.
{
  assert.strictEqual(isVideoUrl("https://host/storage/videos/thumb.png"), false);
}

// An extension must be a real suffix, not a substring of the filename or token.
{
  assert.strictEqual(isVideoUrl("https://host/media/videos/mp4-poster.png"), false);
  assert.strictEqual(isVideoUrl("https://host/media/videos/a.png?token=zzz.mp4zzz"), false);
}

console.log("media-kind.check.mts OK");
