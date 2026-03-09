import Link from "next/link";
import type { ReactNode } from "react";

type KnowledgeShellProps = {
  children: ReactNode;
  /** Optional H1 title when not using KnowledgeHeader */
  title?: string;
};

export default function KnowledgeShell({ children, title }: KnowledgeShellProps) {
  return (
    <main className="container">
      <nav aria-label="Knowledge navigation" className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        <Link href="/data">Back to Data Hub</Link>
        {" · "}
        <Link href="/knowledge/pages">Back to Knowledge Directory</Link>
      </nav>
      {title && <h1 style={{ marginBottom: 8 }}>{title}</h1>}
      {children}
    </main>
  );
}
