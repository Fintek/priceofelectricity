"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={onSubmit} role="search" style={{ display: "flex", gap: 6 }}>
      <input
        type="search"
        name="q"
        aria-label="Search site"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        style={{ width: 180, maxWidth: "40vw", padding: "6px 8px" }}
      />
      <button type="submit">Search</button>
    </form>
  );
}
