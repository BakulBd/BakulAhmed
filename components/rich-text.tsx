import { Fragment, type ElementType } from "react";

/**
 * Renders **bold** spans from plain content strings — avoids putting raw
 * HTML in lib/content.ts while still allowing emphasis in prose.
 */
export default function RichText({
  text,
  as: Tag = "p",
  className = "",
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Tag className={className}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-fg">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </Tag>
  );
}
