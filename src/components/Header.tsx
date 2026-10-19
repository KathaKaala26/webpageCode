"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import { useCart } from "@/context/CartContext";
import { BagIcon, CloseIcon, KKMark, MenuIcon } from "./Icons";

export default function Header() {
  const pathname = usePathname();
  const { count, openDrawer, ready } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 bg-maroon text-shankh shadow-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="container-kk flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.name} home`}>
          <KKMark className="h-10 w-10 shrink-0" />
          <span className="font-display text-xl font-semibold leading-none tracking-wide sm:text-2xl">{site.name}</span>
        </Link>

        <nav className="hidden lg:block" aria-label="Main">
          <ul className="flex items-center gap-1">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-[0.14em] transition ${
                    isActive(n.href) ? "bg-haldi text-maroon-deep" : "hover:bg-white/10"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openDrawer}
            className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-white/10"
            aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
          >
            <BagIcon />
            {ready && count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-haldi px-1 text-[11px] font-extrabold text-maroon-deep">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
      <div className="patta-band-thin" />

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-50 bg-ink/60 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <nav
        id="mobile-menu"
        aria-label="Mobile"
        className={`fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-sm flex-col bg-maroon-deep transition-transform duration-300 lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="font-display text-xl">Menu</span>
          <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>
        <div className="patta-band" />
        <ul className="flex flex-1 flex-col gap-1 p-4">
          {nav.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className={`block rounded-xl px-4 py-4 text-sm font-bold uppercase tracking-[0.18em] ${
                  isActive(n.href) ? "bg-haldi text-maroon-deep" : "hover:bg-white/10"
                }`}
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="px-6 pb-8 font-display text-lg italic text-haldi-light">{site.tagline}</p>
      </nav>
    </header>
  );
}
