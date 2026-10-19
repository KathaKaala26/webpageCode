export default function SectionHeading({
  eyebrow,
  title,
  align = "center",
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: string;
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className={`mt-2 text-4xl font-semibold leading-tight sm:text-5xl ${Tag === "h1" ? "sm:text-6xl" : ""}`}>{title}</Tag>
      <div className={`mt-4 flex items-center gap-2 ${center ? "justify-center" : ""}`} aria-hidden>
        <span className="h-px w-10 bg-haldi" />
        <span className="h-2 w-2 rotate-45 bg-sindoor" />
        <span className="h-px w-10 bg-haldi" />
      </div>
    </div>
  );
}
