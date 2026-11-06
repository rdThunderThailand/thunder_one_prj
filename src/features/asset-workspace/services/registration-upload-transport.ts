const UPLOAD_TIMEOUT_MS = 120000;

/** fetch cannot report bytes sent, so a request that shows progress uses XMLHttpRequest. */
function putWithProgress(
  file: File,
  signedUploadUrl: string,
  mimeType: string,
  onProgress: (percent: number) => void,
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", signedUploadUrl);
    request.timeout = UPLOAD_TIMEOUT_MS;
    request.setRequestHeader("Content-Type", mimeType);
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress((event.loaded / event.total) * 100);
    };
    request.onerror = () => reject(new Error("The upload failed."));
    request.ontimeout = () => reject(new Error("The upload timed out."));
    request.onabort = () => reject(new Error("The upload was cancelled."));
    request.onload = () => resolve({
      ok: request.status >= 200 && request.status < 300,
      status: request.status,
      json: async () => JSON.parse(request.responseText) as unknown,
    });
    request.send(file);
  });
}

/** The signed Storage request is shared by Single Register and bulk import. */
export async function putRegistrationUpload(
  file: File,
  signedUploadUrl: string,
  mimeType: string,
  checkActive: () => void = () => {},
  onProgress?: (percent: number) => void,
): Promise<{ ok: boolean; status: number }> {
  const response = onProgress && typeof XMLHttpRequest !== "undefined"
    ? await putWithProgress(file, signedUploadUrl, mimeType, onProgress)
    : await fetch(signedUploadUrl, {
      method: "PUT",
      body: file,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": mimeType, "x-upsert": "false" },
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
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
