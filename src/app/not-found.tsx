import Link from "next/link";
import messages from "../../messages/en.json";
import { LabMessageDocument } from "@/components/lab-paper/LabMessagePage";

const { notFound, play, home } = messages.errorPages;

/** A 404 for a path the middleware skips, such as one that looks like a file; every other unknown path gets [locale]/not-found.tsx. */
export default function RootNotFound() {
  return (
    <LabMessageDocument title={`${notFound.title} | Memory Chess`} kicker="404" heading={notFound.heading} body={notFound.body}>
      <Link href="/game" className="lab-btn lab-btn-primary">
        {play}
      </Link>
      <Link href="/" className="lab-btn lab-btn-secondary">
        {home}
      </Link>
    </LabMessageDocument>
  );
}
