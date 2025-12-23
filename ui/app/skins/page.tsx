import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import SkinsClient from "./SkinsClient";

export default function SkinsPage() {
  return (
    <PageWrapper
      title="Скины"
      paragraphs={[
        "Тестовая страница под 3D-скины.",
        "Пока тут Люкс в виде GLB.",
      ]}
    >
      <SkinsClient />
    </PageWrapper>
  );
}
