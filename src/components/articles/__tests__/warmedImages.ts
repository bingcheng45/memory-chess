import { createEvent, fireEvent } from "@testing-library/react";

type PointerType = "mouse" | "touch" | "pen";

// jsdom 20 has no PointerEvent, so the pointer type is put on the event by hand.
export function pointerEnters(target: HTMLElement, pointerType: PointerType): void {
  const event = createEvent.pointerOver(target);
  Object.defineProperty(event, "pointerType", { value: pointerType });
  fireEvent(target, event);
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
