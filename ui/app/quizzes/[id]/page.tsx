import type { Metadata } from "next";
import QuizDetail from"./QuizDetail";export default function Page(){return <QuizDetail/>}

export const metadata: Metadata = {
  title: "Квиз Wild Rift",
  description: "Интерактивный квиз по Wild Rift.",
  robots: { index: false, follow: false },
};
