import type { Metadata } from "next";
import QuizCatalog from "./QuizCatalog";
export const metadata:Metadata={title:"Квизы Wild Rift",description:"Интерактивные квизы сообщества Wild Rift"};
export default function Page(){return <QuizCatalog/>}
