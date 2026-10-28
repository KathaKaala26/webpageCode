import Link from "next/link";
import { MailIcon } from "./Icons";

/**
 * Stands in for AddToCartButton while Stripe checkout is offline — sends
 * shoppers to the Contact form (pre-filled with the item) instead of the
 * cart. Swap this back for AddToCartButton in ProductCard and the product
 * page once card payments are live again.
 */
export default function InquireButton({
  title,
  available,
  compact = false,
}: {
  title: string;
  available: boolean;
  compact?: boolean;
}) {
  if (!available) {
    return (
      <button type="button" disabled className={compact ? "btn-outline px-4" : "btn-outline w-full"}>
        Sold
      </button>
    );
  }

  const href = `/contact?title=${encodeURIComponent(title)}`;

  if (compact) {
    return (
      <Link href={href} className="btn-primary px-4" aria-label={`Enquire about ${title}`}>
        <MailIcon className="h-4 w-4" />
        Enquire
      </Link>
    );
  }

  return (
    <Link href={href} className="btn-primary h-12 w-full">
      <MailIcon className="h-5 w-5" />
      Enquire to buy
    </Link>
  );
}
