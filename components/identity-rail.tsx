"use client";

import { useState } from "react";
import { Chevron, Download, iconMap, type IconName } from "./icons";
import PhotoSwiper from "./photo-swiper";
import { contactDetails, profile, socials } from "@/lib/content";

/**
 * The persistent identity rail: portrait, name, how to reach him. Sticky
 * beside the content panel on wide screens; a compact card with a disclosure
 * on small ones.
 */
export default function IdentityRail() {
  const [open, setOpen] = useState(false);

  return (
    <aside
      aria-label="Profile"
      className="panel shine shine--panel h-fit p-5 sm:p-6 lg:sticky lg:top-6 min-w-0"
    >
      <div className="flex items-center gap-4 max-[340px]:gap-3 lg:flex-col lg:gap-0">
        <div className="shine relative w-20 shrink-0 rounded-2xl max-[340px]:w-14 [@media(max-height:500px)]:w-14 lg:w-full">
          <PhotoSwiper photos={profile.photos} className="aspect-square w-full" />
        </div>

        <div className="min-w-0 lg:mt-5 lg:text-center">
          <p className="rail__name truncate text-lg font-semibold tracking-[-0.02em] text-fg max-[340px]:whitespace-normal max-[340px]:text-base max-[340px]:leading-tight lg:text-[1.5rem]">
            {profile.name}
          </p>
          {/* Below 380px a pill this long wraps to three lines beside the
              portrait; there it sheds the pill and reads as a plain subtitle. */}
          <p className="tile mt-2 inline-block max-w-full px-3 py-1.5 text-[0.72rem] leading-snug text-muted max-[379px]:mt-1 max-[379px]:border-0 max-[379px]:bg-transparent max-[379px]:p-0 max-[379px]:shadow-none">
            {profile.roleChip}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="rail-details"
          className="tile ml-auto inline-flex size-9 shrink-0 items-center justify-center max-[340px]:size-8 text-accent transition-colors duration-300 lg:hidden"
        >
          <span className="sr-only">{open ? "Hide contact details" : "Show contact details"}</span>
          <Chevron className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div id="rail-details" className={`${open ? "block" : "hidden"} lg:block`}>
        <hr className="my-5 border-line lg:my-6" />

        <ul className="space-y-3.5">
          {contactDetails.map((item) => {
            const Icon = iconMap[item.icon as IconName];
            const body = (
              <>
                <span className="icon-chip size-10">
                  <Icon width={16} height={16} />
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block">{item.label}</span>
                  <span className="mt-1 block truncate text-[0.85rem] text-soft">{item.value}</span>
                </span>
              </>
            );
            return (
              <li key={item.label} className="flex min-w-0 items-center gap-3.5">
                {"href" in item && item.href ? (
                  <a
                    href={item.href}
                    className="flex min-w-0 items-center gap-3.5 transition-colors duration-300 hover:text-accent"
                  >
                    {body}
                  </a>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>

        <hr className="my-5 border-line" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ul className="flex items-center gap-0.5">
            {socials.map((social) => {
              const Icon = iconMap[social.icon as IconName];
              return (
                <li key={social.label}>
                  <a
                    href={social.href}
                    {...(social.href.startsWith("http") ? { target: "_blank", rel: "me noreferrer noopener" } : {})}
                    className="inline-flex size-9 items-center justify-center rounded-xl text-muted transition-colors duration-300 hover:bg-panel-hover hover:text-accent"
                  >
                    <Icon width={17} height={17} />
                    <span className="sr-only">{social.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href={profile.cv}
            download
            className="btn btn--primary btn--sm btn-shine"
          >
            <Download width={14} height={14} className="btn__icon--down" />
            CV
          </a>
        </div>
      </div>
    </aside>
  );
}
