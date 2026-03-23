import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
      <p
        className="font-bold text-primary mb-2"
        style={{ fontFamily: "var(--font-oswald), Oswald, sans-serif", fontSize: "clamp(5rem, 10vw, 10rem)", lineHeight: 1 }}
      >
        404
      </p>
      <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-all"
      >
        Back to Home
      </Link>
    </div>
  );
}
