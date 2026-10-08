import type { TrendSetting } from "@/lib/lab/engine";

/** The record's one way to print seconds: a non-breaking space keeps each figure on one line with its unit. */
export const seconds = (value: number | string) => `${value} s`;

/** A setting's message values, with its study time printed as seconds. */
export const settingValues = (setting: TrendSetting) => ({ ...setting, studyTime: seconds(setting.memorizeSeconds) });
