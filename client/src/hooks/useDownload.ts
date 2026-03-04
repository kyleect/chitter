import { useCallback } from "react";

type DownloadOptions = {
  mimeType?: string;
};

export function useStringDownload(defaultOptions: DownloadOptions = {}) {
  return useCallback(
    (content: string, filename: string, options?: DownloadOptions) => {
      const { mimeType = "text/plain" } = { ...defaultOptions, ...options };

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";

      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [defaultOptions],
  );
}
