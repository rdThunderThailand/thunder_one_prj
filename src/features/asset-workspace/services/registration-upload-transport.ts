/** The signed Storage request is shared by Single Register and bulk import. */
export async function putRegistrationUpload(
  file: File,
  signedUploadUrl: string,
  mimeType: string,
  checkActive: () => void = () => {},
): Promise<{ ok: boolean; status: number }> {
  const response = await fetch(signedUploadUrl, {
    method: "PUT",
    body: file,
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": mimeType, "x-upsert": "false" },
    signal: AbortSignal.timeout(120000),
  });
  checkActive();
  // A retry can find the immutable staging object; completion still verifies its bytes.
  let stagingExists = response.status === 409;
  if (!response.ok && response.status === 400) {
    const body: unknown = await response.json().catch(() => null);
    stagingExists = typeof body === "object" && body !== null && "error" in body && body.error === "Duplicate";
  }
  checkActive();
  return { ok: response.ok || stagingExists, status: response.status };
}
