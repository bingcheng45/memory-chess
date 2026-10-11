const REVOKE_AFTER_MS = 30_000;

/** Saves a file through a link. Firefox ignores a click on a detached link, and Safari can still be reading the blob after click returns. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}
