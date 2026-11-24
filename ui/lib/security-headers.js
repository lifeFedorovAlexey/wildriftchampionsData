const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

export function getContentSecurityPolicy(nonce, env = process.env) {
  const localDev = env.NODE_ENV === "development" && env.WR_LOCAL_DEV === "true";
  const nonceSource = `'nonce-${nonce}'`;
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://accounts.google.com https://oauth.yandex.ru https://telegram.org",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' ${nonceSource} 'strict-dynamic' https://mc.yandex.ru https://telegram.org`,
    `style-src 'self' ${nonceSource}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.com https://s3.twcstorage.ru https://*.twcstorage.ru https://sun9-1.userapi.com https://lh3.googleusercontent.com https://i.ytimg.com https://t.me https://vkvideo.ru https://static.rtbcdn.ru https://pic.rtbcdn.ru https://max.ru",
    "font-src 'self' data:",
    "connect-src 'self' https://mc.yandex.ru https://mc.yandex.com wss://mc.yandex.ru wss://mc.yandex.com https://telegram.org https://oauth.telegram.org https://oauth.yandex.ru https://login.yandex.ru https://www.googleapis.com https://oauth2.googleapis.com https://openidconnect.googleapis.com",
    "frame-src 'self' https://mc.yandex.ru https://oauth.telegram.org https://telegram.org",
    "media-src 'self' blob: https://s3.twcstorage.ru https://*.twcstorage.ru",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ];
  if (!localDev) return directives.join("; ");
  return directives
    .filter((value) => value !== "upgrade-insecure-requests")
    .map((value) => {
      if (value.startsWith("script-src ")) return `${value} 'unsafe-eval'`;
      // Next dev injects style blocks on hot updates without a nonce.
      if (value.startsWith("style-src ")) return "style-src 'self' 'unsafe-inline'";
      if (value.startsWith("connect-src ")) return `${value} http://127.0.0.1:3390 ws://127.0.0.1:3300 ws://127.0.0.1:3310`;
      if (value.startsWith("img-src ") || value.startsWith("media-src ")) return `${value} http://127.0.0.1:3390`;
      return value;
    })
    .join("; ");
}

export function getSecurityHeaders(env = process.env) {
  return env.NODE_ENV === "development" && env.WR_LOCAL_DEV === "true"
    ? securityHeaders.filter(({ key }) => key !== "Strict-Transport-Security")
    : securityHeaders;
}
