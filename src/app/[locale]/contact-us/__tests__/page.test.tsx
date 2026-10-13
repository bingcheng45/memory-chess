import { fireEvent, render, screen, waitFor } from "@/test-utils/intl";
import ContactUs from "@/app/[locale]/contact-us/page";

const push = jest.fn();
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push }),
}));

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm() {
  fill("Name", "Verify Run");
  fill("Email", "verify@example.com");
  fill("Inquiry type", "feedback");
  fill("Message", "verification probe, please ignore");
}

function answerWith(status: number, body: object): jest.Mock {
  const fetchMock = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
  global.fetch = fetchMock;
  return fetchMock;
}

function describedText(element: HTMLElement): string[] {
  return (element.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? `missing ${id}`);
}

describe("ContactUs", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it("labels every field above its control and ties its hint to it", () => {
    render(<ContactUs />);

    expect(describedText(screen.getByLabelText("Name"))).toEqual(["At least 2 characters."]);
    expect(describedText(screen.getByLabelText("Email"))).toEqual(["Replies go to this address."]);
    expect(describedText(screen.getByLabelText("Inquiry type"))).toEqual(["Each type is explained below the form."]);
    expect(describedText(screen.getByLabelText("Message"))).toEqual(["At least 10 characters."]);
    expect(
      Array.from((screen.getByLabelText("Inquiry type") as HTMLSelectElement).options).map((option) => [option.value, option.text]),
    ).toEqual([
      ["", "Select inquiry type"],
      ["feedback", "Feedback"],
      ["feature", "Feature request"],
      ["inquiry", "General inquiry"],
      ["business", "Business opportunity"],
    ]);
  });

  it("on an empty submit, ties each field's message to it and sends nothing", async () => {
    const fetchSpy = answerWith(200, { success: true });
    render(<ContactUs />);

    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true"));
    expect(describedText(screen.getByLabelText("Name"))).toEqual(["At least 2 characters.", "Name must be at least 2 characters."]);
    expect(describedText(screen.getByLabelText("Email"))).toEqual(["Replies go to this address.", "Please enter a valid email address."]);
    expect(describedText(screen.getByLabelText("Message"))).toEqual(["At least 10 characters.", "Message must be at least 10 characters."]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts the four fields as before and shows the sent note in the form's place", async () => {
    const fetchSpy = answerWith(200, { success: true });
    render(<ContactUs />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("heading", { name: "Message sent" })).toHaveFocus();
    expect(fetchSpy).toHaveBeenCalledWith("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"Verify Run","email":"verify@example.com","type":"feedback","message":"verification probe, please ignore"}',
    });
    expect(document.querySelector("form")).toHaveAttribute("inert");
  });

  it("keeps the form and reports the server's reason for a failed send in the status line", async () => {
    answerWith(500, { error: "Failed to send message", details: "no credentials" });
    render(<ContactUs />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Failed to submit form: no credentials"));
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    expect(screen.queryByRole("heading", { name: "Message sent" })).not.toBeInTheDocument();
  });

  it("reports a failed send with no reason, or one that never answered, in the generic words", async () => {
    answerWith(500, { error: "Failed to send message" });
    render(<ContactUs />);

    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("An error occurred while submitting the form. Please try again."),
    );

    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("An error occurred while submitting the form. Please try again."),
    );
  });
});
