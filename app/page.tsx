import { SearchBox } from "@/components/SearchBox";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <>
      <ThemeToggle />
      <main className="page-center">
        <SearchBox />
      </main>
    </>
  );
}
