"use client";

import dynamic from "next/dynamic";

// dynamic() splits only from a client module; called from the server page it
// left both bodies in the page chunk, so every locale downloaded the lab.
export const BrainLabHome = dynamic(() => import("./BrainLabHome").then((module) => module.BrainLabHome));
export const LegacyHome = dynamic(() => import("./LegacyHome").then((module) => module.LegacyHome));
