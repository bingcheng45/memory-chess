import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Footer from "@/components/ui/Footer";
import { EDITORIAL_STYLES } from "@/components/editorial/editorialStyles";

type EditorialPageShellProps = {
  children: ReactNode;
  mainClassName?: string;
};

type EditorialHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  align?: "center" | "left";
};

type EditorialActionLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  trackingName?: string;
};

export function EditorialPageShell({
  children,
  mainClassName = "",
}: EditorialPageShellProps) {
  return (
    <div className={EDITORIAL_STYLES.page}>
      <main className={`${EDITORIAL_STYLES.main} ${mainClassName}`}>
        <div className={EDITORIAL_STYLES.brand}>
          <PageHeader showSoundSettings={false} className="mb-0" />
        </div>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  description,
  children,
  align = "center",
}: EditorialHeroProps) {
  const alignment =
    align === "center"
      ? EDITORIAL_STYLES.hero
      : "mb-10 max-w-3xl text-left sm:mb-14";

  return (
    <header className={alignment}>
      <p className={`${EDITORIAL_STYLES.eyebrow} mb-3`}>{eyebrow}</p>
      <h1 className={EDITORIAL_STYLES.pageTitle}>{title}</h1>
      <p
        className={
          align === "center"
            ? EDITORIAL_STYLES.heroCopy
            : "mt-5 max-w-2xl text-base leading-7 text-text-muted sm:text-lg sm:leading-8"
        }
      >
        {description}
      </p>
      {children}
    </header>
  );
}

export function EditorialActionLink({
  href,
  children,
  variant = "primary",
  className = "",
  trackingName,
}: EditorialActionLinkProps) {
  return (
    <Link
      href={href}
      className={`${
        variant === "primary"
          ? EDITORIAL_STYLES.primaryAction
          : EDITORIAL_STYLES.secondaryAction
      } ${className}`}
      {...(trackingName ? { "data-learn-cta": trackingName } : {})}
    >
      {children}
    </Link>
  );
}
