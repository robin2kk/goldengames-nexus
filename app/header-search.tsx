"use client";
import { FormEvent } from "react";
import { Search } from "lucide-react";

export function HeaderSearch({ initialQuery = "" }: { initialQuery?: string }) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("q");
    const cleanQuery = typeof value === "string" ? value.trim() : "";
    window.dispatchEvent(new CustomEvent("goldengames-search", { detail: cleanQuery }));
    const url = cleanQuery ? `/?q=${encodeURIComponent(cleanQuery)}#latest` : "/#latest";
    window.history.replaceState(null, "", url);
    document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
  }
  return <form className="header-search" onSubmit={submit} role="search">
    <Search size={17}/>
    <input name="q" defaultValue={initialQuery} placeholder="Search news, apps, homebrew..." aria-label="Search GoldenGames Nexus"/>
    <button type="submit">Search</button>
  </form>;
}
