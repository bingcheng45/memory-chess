import * as Dialog from "@radix-ui/react-dialog";
import { act, fireEvent, render, screen } from "@/test-utils/intl";
import { ShareDialog } from "@/components/share/ShareDialog";

const CAPTION = { text: "I recalled 4 of 5 pieces.", url: "https://thememorychess.com/share/result/x" };
const PNG = new Blob(["png"], { type: "image/png" });

function open() {
  render(
    <Dialog.Root open>
      <ShareDialog surface="result" title="Share your result" caption={CAPTION} image={{ state: "ready", blob: PNG, src: "blob:card" }} alt="card" fileName="card.png" />
    </Dialog.Root>,
  );
}

const press = (name: string) => act(async () => fireEvent.click(screen.getByRole("button", { name })));

function mockClipboard(writeText: jest.Mock) {
  Object.assign(navigator, { clipboard: { writeText } });
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("Share dialog copy feedback", () => {
  it("marks Copy image with a check for 2 seconds after the image is copied, and not when it is refused", async () => {
    class FakeClipboardItem {
      static supports = () => true;
    }
    Object.assign(globalThis, { ClipboardItem: FakeClipboardItem });
    const write = jest.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("denied"));
    Object.assign(navigator, { clipboard: { writeText: jest.fn(), write } });
    open();

    await press("Copy image");
    expect(screen.getByRole("button", { name: "Copy image" })).toHaveAttribute("data-state", "copied");
    expect(screen.getByRole("status")).toHaveTextContent("Image copied.");
    act(() => void jest.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Copy image" })).toHaveAttribute("data-state", "idle");

    await press("Copy image");
    expect(screen.getByRole("button", { name: "Copy image" })).toHaveAttribute("data-state", "failed");
  });

  it("confirms a caption copy on the button itself, then returns the label after 2 seconds", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    open();

    await press("Copy caption");

    expect(writeText).toHaveBeenCalledWith(`${CAPTION.text} ${CAPTION.url}`);
    expect(screen.getByRole("button", { name: "Caption copied." })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy caption" })).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Caption copied.");

    act(() => void jest.advanceTimersByTime(2000));

    expect(screen.getByRole("button", { name: "Copy caption" })).toBeInTheDocument();
  });

  it("restarts the 2 seconds when pressed again while it shows the confirmation", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    open();

    await press("Copy caption");
    act(() => void jest.advanceTimersByTime(1500));
    await press("Caption copied.");
    act(() => void jest.advanceTimersByTime(1500));

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Caption copied." })).toBeInTheDocument();
    act(() => void jest.advanceTimersByTime(500));
    expect(screen.getByRole("button", { name: "Copy caption" })).toBeInTheDocument();
  });

  it("keeps the label and reports the failure when the clipboard refuses", async () => {
    mockClipboard(jest.fn().mockRejectedValue(new Error("denied")));
    open();

    await press("Copy caption");

    expect(screen.getByRole("button", { name: "Copy caption" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copy did not work here. The caption is selected, so copy it yourself.");
  });
});
