
import { LanguageSelector } from "./LanguageSelector";

export function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12">Welcome to PairMaster!</h1>
      <LanguageSelector />
    </div>
  );
}
