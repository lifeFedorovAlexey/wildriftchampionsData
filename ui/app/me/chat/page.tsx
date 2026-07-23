import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import TopPillLink from "@/components/TopPillLink";
import ChatMvpClient from "@/components/chat/ChatMvpClient";
import { normalizeChatStorageOrigin } from "@/lib/chat-media-url.js";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import profileStyles from "../profile.module.css";

export default async function MeChatPage() {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  const session = await fetchSiteUserSession(sessionToken, process.env);
  const chatStorageOrigin = normalizeChatStorageOrigin(
    process.env.S3_PUBLIC_BASE_URL,
  );

  if (!session) {
    redirect("/me");
  }

  return (
    <div className={profileStyles.page}>
      <section className={profileStyles.shell}>
        <div className={profileStyles.head}>
          <div>
            <h1 className={profileStyles.title}>Чат</h1>
          </div>
          <TopPillLink href="/me">
            <FaArrowLeft aria-hidden="true" /> В профиль
          </TopPillLink>
        </div>

        <ChatMvpClient storageOrigin={chatStorageOrigin} />
      </section>
    </div>
  );
}
