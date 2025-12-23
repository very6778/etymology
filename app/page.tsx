"use client";

import { SearchBox } from "@/components/SearchBox";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
    return (
        <main className="home-page page-center">
            <ThemeToggle />

            <div className="container">
                <SearchBox />
            </div>
        </main>
    );
}
