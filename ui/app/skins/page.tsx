import dynamic from "next/dynamic";
import { SkinsSkeleton } from "@/components/ui/LazySkeletons";

const SkinsClient = dynamic(() => import("./SkinsClient"), {
  loading: () => <SkinsSkeleton />,
});

export default function SkinsPage() {
  return <SkinsClient />;
}
