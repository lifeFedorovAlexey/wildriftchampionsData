import {
  FaCircleUser,
  FaGoogle,
  FaTelegram,
  FaVk,
  FaYandex,
} from "react-icons/fa6";

type AuthProviderIconProps = {
  providerId: string;
  className?: string;
};

export default function AuthProviderIcon({
  providerId,
  className = "",
}: AuthProviderIconProps) {
  switch (providerId) {
    case "google":
      return <FaGoogle className={className} color="#4285f4" aria-hidden="true" />;
    case "yandex":
      return <FaYandex className={className} color="#fc3f1d" aria-hidden="true" />;
    case "vk":
      return <FaVk className={className} color="#2787f5" aria-hidden="true" />;
    case "telegram":
      return <FaTelegram className={className} color="#27a6e5" aria-hidden="true" />;
    default:
      return <FaCircleUser className={className} aria-hidden="true" />;
  }
}
