import { Eye, Heart, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type CountProps = {
  count: number | undefined;
};

type CountKind = "views" | "likes";

const ICON_CLASS = "mr-[5px] inline-block h-[15px] w-[15px] align-[-3px]";
const ICONS: Record<CountKind, LucideIcon> = { views: Eye, likes: Heart };

function Count({ count, kind }: CountProps & { kind: CountKind }) {
  const t = useTranslations("articles.counts");
  if (count === undefined || count <= 0) return null;
  const Icon = ICONS[kind];

  return (
    <span>
      <Icon aria-hidden="true" strokeWidth={1.8} className={ICON_CLASS} />
      {t(kind, { count })}
    </span>
  );
}

export function ViewCount({ count }: CountProps) {
  return <Count count={count} kind="views" />;
}

export function LikeCount({ count }: CountProps) {
  return <Count count={count} kind="likes" />;
}
