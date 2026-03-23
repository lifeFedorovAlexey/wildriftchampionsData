import dynamic from "next/dynamic";

import { SkinsSkeleton } from "@/components/ui/LazySkeletons";

import { fetchSkinsListFromApi } from "./skins-lib";

const SkinsClient = dynamic(() => import("./SkinsClient"), {
  loading: () => <SkinsSkeleton />,
});

export default async function SkinsPage() {
  const champions = await fetchSkinsListFromApi();
  return <SkinsClient champions={champions} />;
}
