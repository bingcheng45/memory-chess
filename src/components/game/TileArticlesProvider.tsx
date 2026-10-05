"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TileArticle } from "@/lib/articles/tile";

const NO_ARTICLES: readonly TileArticle[] = [];

const TileArticlesContext = createContext(NO_ARTICLES);

type TileArticlesProviderProps = {
  articles: readonly TileArticle[];
  children: ReactNode;
};

export default function TileArticlesProvider({ articles, children }: TileArticlesProviderProps) {
  return <TileArticlesContext.Provider value={articles}>{children}</TileArticlesContext.Provider>;
}

export function useTileArticles(): readonly TileArticle[] {
  return useContext(TileArticlesContext);
}
