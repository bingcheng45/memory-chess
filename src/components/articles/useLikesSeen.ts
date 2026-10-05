import { useSyncExternalStore } from "react";
import { NOT_LIKED, likedStore } from "@/lib/articles/likedStore";

export function useLikesSeen(slug: string): number {
  return useSyncExternalStore(
    likedStore.subscribe,
    () => likedStore.likesSeen(slug),
    () => NOT_LIKED,
  );
}
