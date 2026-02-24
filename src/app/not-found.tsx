import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Page not found</h1>
      <p style={{ fontSize: 18, color: "#555" }}>
        The page you requested could not be found.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Go back home</Link>
      </p>
    </main>
  );
}
