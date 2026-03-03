import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>404</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Stranica nije prona\u0111ena / Page not found
        </p>
        <Link
          href="/hr"
          style={{
            color: "hsl(213, 90%, 45%)",
            textDecoration: "underline",
          }}
        >
          &larr; Povratak na po\u010Detnu / Back to Home
        </Link>
      </div>
    </div>
  );
}
