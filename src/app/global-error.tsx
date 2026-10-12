"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LabMessageDocument } from "@/components/lab-paper/LabMessageDocument";
import { GLOBAL_ERROR_COPY as COPY } from "@/components/lab-paper/globalErrorCopy";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/** Replaces the whole document when the locale layout itself fails, so it draws its own html and body. */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("The site layout failed to render", error);
  }, [error]);

  return (
    <LabMessageDocument title={`${COPY.title} | Memory Chess`} heading={COPY.heading} body={COPY.body}>
      <button type="button" className="lab-btn lab-btn-primary" onClick={reset}>
        {COPY.retry}
      </button>
      <Link href="/" className="lab-btn lab-btn-secondary">
        {COPY.home}
      </Link>
    </LabMessageDocument>
  );
}
