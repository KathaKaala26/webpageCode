import Link from "next/link";
import { nav, site } from "@/lib/site";
import { KKMark } from "./Icons";
import InstallButton from "./InstallButton";

export default function Footer() {
  const { address, hours, phone, email } = site.location;
  return (
    <footer className="mt-20 bg-maroon-deep text-shankh/90">
      <div className="patta-band" />
      <div className="container-kk grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <KKMark className="h-12 w-12" />
            <span className="font-display text-2xl text-shankh">{site.name}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-shankh/70">
            From the small suburbs of Minneapolis, we strive to bring the culture of India to the world stage.
          </p>
          <div className="mt-6">
            <InstallButton />
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-body text-xs font-bold uppercase tracking-[0.28em] text-haldi">Explore</h2>
          <ul className="space-y-2 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="hover:text-haldi-light">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cart" className="hover:text-haldi-light">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 font-body text-xs font-bold uppercase tracking-[0.28em] text-haldi">Location &amp; Hours</h2>
          <address className="space-y-2 text-sm not-italic">
            {address && <p>{address}</p>}
            {hours && <p>{hours}</p>}
            {phone && (
              <p>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-haldi-light">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p>
                <a href={`mailto:${email}`} className="hover:text-haldi-light">
                  {email}
                </a>
              </p>
            )}
            <p className="pt-2 text-shankh/60">Shipping across the USA &amp; Canada · Cash on delivery or card</p>
          </address>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-kk flex flex-col items-center justify-between gap-2 py-5 text-xs text-shankh/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Authentic art, sourced directly from artisans in India.</p>
        </div>
      </div>
    </footer>
  );
}
