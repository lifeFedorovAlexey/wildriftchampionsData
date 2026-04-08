import Image from "next/image";

type AuthProviderIconProps = {
  providerId: string;
  className?: string;
};

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.44a5.4 5.4 0 0 1-2.39 3.55l3.69 2.86c2.15-1.98 3.75-4.9 3.75-8.65Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.69-2.86c-1.03.69-2.35 1.11-4.25 1.11-3.13 0-5.79-2.11-6.74-4.96l-3.81 2.95A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC04"
        d="M5.26 14.38A7.2 7.2 0 0 1 4.88 12c0-.82.14-1.61.38-2.38l-3.81-2.95A12 12 0 0 0 0 12c0 1.93.46 3.75 1.45 5.33l3.81-2.95Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.79l3.45-3.45C17.95 1.15 15.24 0 12 0A12 12 0 0 0 1.45 6.67l3.81 2.95C6.21 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function YandexIcon({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/provider-icons/yandex-16.png"
      alt=""
      aria-hidden="true"
      width={16}
      height={16}
      className={className}
    />
  );
}

function VkIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="12" fill="#2787F5" />
      <path
        fill="#fff"
        d="M12.58 16.95h-.88s-1.94-.12-3.65-1.68c-1.86-1.7-3.5-5.08-3.5-5.08s-.1-.22.01-.33c.12-.12.44-.13.44-.13l2.1-.01s.2.03.34.12c.12.08.19.23.19.23s.34.76.8 1.44c.89 1.33 1.31 1.62 1.61 1.46.44-.22.31-2.12.31-2.12s.01-.69-.22-1c-.18-.24-.52-.31-.67-.33-.12-.02.08-.29.35-.42.41-.19 1.13-.2 1.98-.2.66.01.85.04 1.11.1.62.14.59.47.55 1.25l-.02.81v.21c-.01.39-.02.84.27 1 .14.08.49 0 1.35-1.45.41-.7.72-1.51.72-1.51s.07-.15.2-.22c.13-.08.31-.06.31-.06h2.2s.66-.08.77.19c.12.29-.25.97-1.17 2.03-.87 1-1.29 1.37-1.25 1.7.03.24.29.46.8.87 1.05.84 1.34 1.28 1.4 1.39l.01.02c.49.71-.54.77-.54.77l-1.95.03s-.42.08-.98-.24c-.29-.17-.57-.45-.84-.71-.4-.39-.78-.76-1.1-.67-.54.15-.52 1.11-.52 1.11s0 .2-.11.31c-.12.12-.36.15-.36.15Z"
      />
    </svg>
  );
}

function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <rect width="24" height="24" rx="12" fill="#27A6E5" />
      <path
        fill="#fff"
        d="m17.53 7.34-10.95 4.22c-.75.3-.75.72-.14.91l2.81.88.66 2.08c.08.23.04.33.29.33.19 0 .28-.08.39-.17.07-.06.5-.48 1-.96l2.08 1.54c.38.21.66.1.75-.35l1.86-8.78c.13-.55-.21-.8-.75-.56Z"
      />
    </svg>
  );
}

function FallbackIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.22" />
      <path
        fill="currentColor"
        d="M12 6.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Zm0 7.4c-2.55 0-4.8 1.27-4.8 3v.4h9.6v-.4c0-1.73-2.25-3-4.8-3Z"
      />
    </svg>
  );
}

export default function AuthProviderIcon({
  providerId,
  className = "",
}: AuthProviderIconProps) {
  switch (providerId) {
    case "google":
      return <GoogleIcon className={className} />;
    case "yandex":
      return <YandexIcon className={className} />;
    case "vk":
      return <VkIcon className={className} />;
    case "telegram":
      return <TelegramIcon className={className} />;
    default:
      return <FallbackIcon className={className} />;
  }
}
