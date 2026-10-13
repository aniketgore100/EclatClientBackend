// A small, dependency-free read of the browser's User-Agent: enough for the admin to tell phone from
// desktop and to spot a checkout problem on one browser. Not a fingerprint — it stores what the browser
// volunteered, nothing more, and "unknown" when it can't tell.
export interface DeviceInfo {
  deviceType: "mobile" | "tablet" | "desktop" | null;
  os: string | null;
  browser: string | null;
  userAgent: string | null;
}

export function parseUserAgent(raw: string | undefined): DeviceInfo {
  const ua = (raw ?? "").trim();
  if (!ua) return { deviceType: null, os: null, browser: null, userAgent: null };

  const tablet = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua);
  const mobile = !tablet && /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua);
  const deviceType = tablet ? "tablet" : mobile ? "mobile" : "desktop";

  const os = /Windows Phone/i.test(ua) ? "Windows Phone"
    : /iPhone|iPad|iPod/i.test(ua) ? "iOS"
    : /Android/i.test(ua) ? "Android"
    : /Windows/i.test(ua) ? "Windows"
    : /Mac OS X|Macintosh/i.test(ua) ? "macOS"
    : /CrOS/i.test(ua) ? "ChromeOS"
    : /Linux/i.test(ua) ? "Linux"
    : null;

  // Order matters: Edge, Opera and Samsung all also say "Chrome"; Chrome also says "Safari".
  const browser = /EdgA?\/|Edg\//i.test(ua) ? "Edge"
    : /OPR\/|Opera/i.test(ua) ? "Opera"
    : /SamsungBrowser/i.test(ua) ? "Samsung Internet"
    : /Firefox|FxiOS/i.test(ua) ? "Firefox"
    : /CriOS|Chrome\//i.test(ua) ? "Chrome"
    : /Safari\//i.test(ua) ? "Safari"
    : null;

  return { deviceType, os, browser, userAgent: ua.slice(0, 300) };
}
