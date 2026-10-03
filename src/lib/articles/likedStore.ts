import { createSlugSetStore } from "@/lib/articles/slugSetStore";

export const LIKED_STORAGE_KEY = "memory-chess:article-likes:v1";

export const likedStore = createSlugSetStore("localStorage", LIKED_STORAGE_KEY);
