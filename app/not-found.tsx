import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/card";
import { ArrowUpRight } from "@/components/icons";
import { PageHeading } from "@/components/page-heading";
import { nav } from "@/lib/content";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <PageHeading lead="That page doesn’t exist — it may have moved, or the link may be wrong.">
        404
      </PageHeading>

      <Card>
        <p className="text-[0.95rem] leading-relaxed text-muted">Try one of these instead:</p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="tile shine shine--hover inline-flex min-h-[2.25rem] items-center gap-2 px-4 py-2.5 text-[0.85rem] text-soft transition-colors duration-300 hover:text-accent"
              >
                {item.label}
                <ArrowUpRight width={14} height={14} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
