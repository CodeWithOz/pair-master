import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

const languages = [
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  // Add more languages as needed
];

export function LanguageSelector() {
  const [, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Select Language to Practice</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {languages.map((lang) => (
          <Card
            key={lang.code}
            className="p-6 hover:bg-gray-50 cursor-pointer"
            onClick={() => setLocation(`/${lang.code}/play`)}
          >
            <h2 className="text-lg font-semibold">{lang.flag} {lang.name} {lang.flag}</h2>
            <p className="text-sm text-gray-600">Learn {lang.name} with English pairs</p>
          </Card>
        ))}
      </div>
    </div>
  );
}