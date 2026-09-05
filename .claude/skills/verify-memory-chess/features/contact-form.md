# Contact form

`/contact-us` is a validated form (name, email, inquiry type, message) that POSTs to `/api/contact`, which appends a row to the owner's production Google Sheet (`src/app/api/contact/route.ts`). That write is the production boundary: a verification run must prove the form and the request, not add rows to the real sheet.

## Sub-features

- `contact-validate` client-side validation blocks short names, invalid emails, and short messages with visible messages.
- `contact-type` the inquiry type select offers Feedback, Feature Request, General Inquiry, Business Opportunity.
- `contact-submit` a valid submit POSTs JSON to `/api/contact`, then shows "Message Sent!" and redirects home.
- `contact-error` a failed POST surfaces an error state instead of the success screen.

## How to get to it (user POV)

- Open `/contact-us` from the footer nav ("Contact Us").
- Open `/contact-us` directly.

## Driving it with cdp.mjs

Preconditions:

- `doctor.sh 4517` reports OK.
- No Google credentials in the environment (the default worktree state), so a real POST cannot reach the production sheet.

- **Validation.** `goto(baseUrl + "/contact-us")`; submit empty with `clickText("button", "Send Message")`; assert validation text appears (e.g. "Name must be at least") and no network success state shows. Screenshot.
- **Fill.** Set the text fields through their labels: `click('input[name="name"]')` then `eval` typing via the native setter is not the user path; prefer focusing the input and using `document.execCommand("insertText", false, "...")`, which React's onChange sees.
- **API boundary without credentials.** `curl -sS -X POST http://127.0.0.1:4517/api/contact -H 'content-type: application/json' -d '{"name":"Verify Run","email":"verify@example.com","type":"feedback","message":"verification probe"}'` returns a 500 with `{"error":"Failed to send message"...}`. That proves the route is wired and proves no row was written. Save the response as evidence.
- **Full success path.** Only meaningful with real Google credentials, and a real submit writes a visible row to the owner's sheet. Do not run it unless the owner has asked for it and expects the row; label the message as a verification probe so it can be deleted.

## Gotchas

- The inquiry type is a Radix Select; it opens on pointer events, so a plain `el.click()` from `eval` may not open it. Validate around it (it has a default error state when unselected) or drive it with keyboard events on the trigger.
- "Message Sent!" auto-redirects to the home page after a short delay; capture the success screenshot immediately after it appears.
- A 500 from `/api/contact` in an uncredentialed run is the expected passing result for the boundary check, not a defect.
