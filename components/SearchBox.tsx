"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBox() {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            router.push(`/${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="search-box">
            <Search className="search-icon" size={20} />
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kelime ara..."
                className="search-input"
                autoFocus
                autoComplete="off"
                spellCheck={false}
            />
        </form>
    );
}
