import Link from "next/link";
import { site } from "@/lib/site";
import { MailIcon, PhoneIcon } from "./Icons";

/** Shown wherever customers pay/check out, while Stripe is still in test mode. */
export default function PaymentNotice() {
  const { phone, email } = site.location;
  if (!phone && !email) return null;

  return (
    <div className="card border border-haldi/40 bg-haldi/10 p-4 text-sm sm:p-5">
      <p className="font-bold text-maroon">Card payments are launching soon</p>
      <p className="mt-1 text-ink-soft">
        We're finishing setup for online card payments. To complete a purchase right now, please contact us directly
        and we'll take care of it.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-sindoor hover:underline">
            <PhoneIcon className="h-4 w-4" /> {phone}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="inline-flex items-center gap-2 font-semibold text-sindoor hover:underline">
            <MailIcon className="h-4 w-4" /> {email}
          </a>
        )}
        <Link href="/contact" className="inline-flex items-center gap-2 font-semibold text-maroon hover:underline">
          Or fill out our contact form →
        </Link>
      </div>
    </div>
  );
}
