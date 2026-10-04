import type { PortraitPhoto } from "@/lib/articles/schema";

export function photoNamed(name: string): PortraitPhoto {
  return { src: `/images/articles/${name}.jpg`, width: 840, height: 1050, alt: `${name} at a chess board` };
}

export function recordWarmedImages(): HTMLImageElement[] {
  const warmed: HTMLImageElement[] = [];
  const RealImage = window.Image;

  beforeEach(() => {
    warmed.length = 0;
    window.Image = function RecordedImage() {
      const image = new RealImage();
      warmed.push(image);
      return image;
    } as unknown as typeof Image;
  });

  afterEach(() => {
    window.Image = RealImage;
    Reflect.deleteProperty(navigator, "connection");
  });

  return warmed;
}

export function setSaveData(saveData: boolean): void {
  Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData } });
}
