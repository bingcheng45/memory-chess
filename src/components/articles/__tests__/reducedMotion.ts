import { REDUCED_MOTION_QUERY } from "@/components/articles/articleFlight";

export function setReducedMotion(isReduced: boolean): void {
  (window.matchMedia as jest.Mock).mockImplementation((query: string) => ({
    matches: isReduced && query === REDUCED_MOTION_QUERY,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}
