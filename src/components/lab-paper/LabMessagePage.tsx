import { LabMessage, type LabMessageProps } from "./LabMessage";
import { LabPaperHeader } from "./LabPaperHeader";
import { LAB_PAPER_CLASS } from "./shell";

/** A message page under the shell header, inside the locale layout: the 404 and the error page. */
export function LabMessagePage(props: LabMessageProps) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <LabMessage {...props} />
    </div>
  );
}
