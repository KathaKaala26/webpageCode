import type { Metadata } from "next";
import { site } from "@/lib/site";
import { MailIcon, PhoneIcon } from "@/components/Icons";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact Us", description: `Get in touch with ${site.name}.` };

export default function ContactPage() {
  const { phone, email } = site.location;

  return (
    <section className="container-kk py-12 sm:py-16">
      <h1 className="text-4xl font-semibold sm:text-5xl">Contact Us</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Card payments are launching soon — in the meantime, reach out by phone, email or the form below and we'll help
        you complete your order.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold text-maroon">Reach us directly</h2>
          {phone && (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-ink hover:text-sindoor">
              <PhoneIcon className="h-5 w-5 shrink-0 text-sindoor" />
              <span className="font-semibold">{phone}</span>
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-3 text-ink hover:text-sindoor">
              <MailIcon className="h-5 w-5 shrink-0 text-sindoor" />
              <span className="font-semibold">{email}</span>
            </a>
          )}
          <p className="pt-2 text-sm text-ink-soft">
            Have an order already? Include your order number and we'll find it right away.
          </p>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
