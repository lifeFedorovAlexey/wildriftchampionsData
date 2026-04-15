import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TopPillLink from "@/components/TopPillLink";
import ChatMvpClient from "@/components/chat/ChatMvpClient";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import profileStyles from "../profile.module.css";

export default async function MeChatPage() {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  const session = await fetchSiteUserSession(sessionToken, process.env);

  if (!session) {
    redirect("/me");
  }

  return (
    <div className={profileStyles.page}>
      <section className={profileStyles.shell}>
        <div className={profileStyles.head}>
          <div>
            <h1 className={profileStyles.title}>Чат</h1>
            <p className={profileStyles.lead}>
              Локальный MVP текстового чата поверх `wr-api` и `wr-chat`.
            </p>
          </div>
          <TopPillLink href="/me">← В профиль</TopPillLink>
        </div>

        <ChatMvpClient />
      </section>
    </div>
  );
}
