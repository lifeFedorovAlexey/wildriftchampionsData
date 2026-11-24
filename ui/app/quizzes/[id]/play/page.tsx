import type { Metadata } from "next";
import{Suspense}from"react";import QuizPlayer from"./QuizPlayer";export default function Page(){return <Suspense fallback={null}><QuizPlayer/></Suspense>}

export const metadata: Metadata = {
  title: "Прохождение квиза Wild Rift",
  description: "Прохождение интерактивного квиза по Wild Rift.",
  robots: { index: false, follow: false },
};
