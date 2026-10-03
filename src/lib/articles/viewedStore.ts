import { createSlugSetStore } from "@/lib/articles/slugSetStore";

export const VIEWED_STORAGE_KEY = "memory-chess:article-viewed:v1";

export const viewedStore = createSlugSetStore("sessionStorage", VIEWED_STORAGE_KEY);
