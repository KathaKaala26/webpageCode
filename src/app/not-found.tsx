import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-kk py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-5xl font-semibold">This page wandered off</h1>
      <p className="mt-4 text-ink-soft">The page you were looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-primary mt-8">
        Back to home
      </Link>
    </section>
  );
}
