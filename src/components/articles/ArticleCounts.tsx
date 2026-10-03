import { Eye, Heart, type LucideIcon } from "lucide-react";
import { ARTICLE_STATS_COPY } from "@/lib/articles/copy";

type CountProps = {
  count: number | undefined;
};

const ICON_CLASS = "mr-[5px] inline-block h-[15px] w-[15px] align-[-3px]";

function Count({ count, icon: Icon, label }: CountProps & { icon: LucideIcon; label: (count: number) => string }) {
  if (count === undefined || count <= 0) return null;

  return (
    <span>
      <Icon aria-hidden="true" strokeWidth={1.8} className={ICON_CLASS} />
      {label(count)}
    </span>
  );
}

export function ViewCount({ count }: CountProps) {
  return <Count count={count} icon={Eye} label={ARTICLE_STATS_COPY.views} />;
}

export function LikeCount({ count }: CountProps) {
  return <Count count={count} icon={Heart} label={ARTICLE_STATS_COPY.likes} />;
}
