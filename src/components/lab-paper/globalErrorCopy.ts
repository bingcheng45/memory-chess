/**
 * English copies of errorPages in messages/en.json, for app/global-error.tsx (a test keeps them equal). That page
 * replaces a root layout that failed, so it cannot rely on the translation provider, and importing the catalogue
 * would put all of it in a bundle every page loads.
 */
export const GLOBAL_ERROR_COPY = {
  title: "Something went wrong",
  heading: "Something went wrong on this page.",
  body: "Your rounds and settings are stored in this browser and are not affected. Try again, or go back to the home page.",
  retry: "Try again",
  home: "Go to the home page",
} as const;
