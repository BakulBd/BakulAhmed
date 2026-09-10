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
      className="panel shine shine--panel h-fit p-5 sm:p-6 lg:sticky lg:top-6"
    >
      <div className="flex items-center gap-4 lg:flex-col lg:gap-0">
        <div className="shine relative w-20 shrink-0 rounded-2xl lg:w-full">
          <PhotoSwiper photos={profile.photos} className="aspect-square w-full" />
        </div>

        <div className="min-w-0 lg:mt-5 lg:text-center">
          <p className="truncate text-lg font-semibold tracking-[-0.02em] text-fg lg:text-[1.5rem]">
            {profile.name}
          </p>
          <p className="tile mt-2 inline-block max-w-full px-3 py-1.5 text-[0.72rem] leading-snug text-muted">
            {profile.roleChip}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="rail-details"
          className="tile ml-auto inline-flex size-9 shrink-0 items-center justify-center text-accent transition-colors duration-300 lg:hidden"
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
                    {...(social.href.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
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
            className="btn-shine inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[0.78rem] font-semibold text-accent-contrast transition-transform duration-300 hover:-translate-y-0.5"
          >
            <Download width={14} height={14} />
            CV
          </a>
        </div>
      </div>
    </aside>
  );
}
