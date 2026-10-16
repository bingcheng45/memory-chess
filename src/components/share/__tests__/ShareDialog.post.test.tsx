import * as Dialog from "@radix-ui/react-dialog";
import { fireEvent, render, screen } from "@/test-utils/intl";
import { ShareDialog } from "@/components/share/ShareDialog";

const CAPTION = { text: "I recalled 4 of 5 pieces (80%).", url: "https://thememorychess.com/share/result/x" };

function open() {
  render(
    <Dialog.Root open>
      <ShareDialog surface="result" title="Share your result" caption={CAPTION} image={{ state: "failed" }} alt="card" fileName="card.png" />
    </Dialog.Root>,
  );
}

describe("Share dialog post buttons", () => {
  it("opens a network's post page without a link analytics click tracking could record", () => {
    const openWindow = jest.spyOn(window, "open").mockReturnValue(null);
    open();

    fireEvent.click(screen.getByRole("button", { name: "X (opens in a new tab)" }));

    expect(openWindow).toHaveBeenCalledWith(
      "https://x.com/intent/post?text=I%20recalled%204%20of%205%20pieces%20(80%25).&url=https%3A%2F%2Fthememorychess.com%2Fshare%2Fresult%2Fx",
      "_blank",
      "noopener,noreferrer",
    );
    expect(document.querySelectorAll("a[href]")).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent("X");
    openWindow.mockRestore();
  });
});
