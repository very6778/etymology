"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { SearchBox } from "@/components/SearchBox";

export default function Home() {
    return (
        <main className="home-page page-center">
            <ThemeToggle />

            <div className="container">
                <header className="home-header">
                    <h1 className="home-title">Etimoloji</h1>
                </header>

                <SearchBox />
            </div>
        </main>
    );
}
