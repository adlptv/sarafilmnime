import Link from "next/link";
import { Compass, Zap, Star, TrendingUp } from "lucide-react";

export default function BrowsePage() {
  const categories = [
    { name: "Ongoing", icon: <Zap />, color: "bg-[var(--neo-yellow)]", link: "/ongoing" },
    { name: "Popular", icon: <Star />, color: "bg-[var(--neo-blue)]", link: "#" },
    { name: "Trending", icon: <TrendingUp />, color: "bg-[var(--neo-pink)]", link: "#" },
  ];

  return (
    <div className="px-6 md:px-20 py-16 flex flex-col gap-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 border-b-8 border-black pb-8">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic flex items-center gap-4">
          <Compass className="text-black transform -rotate-12" size={48} /> Browse Anime
        </h1>
        <p className="font-black text-xl uppercase tracking-widest border-l-8 border-black pl-4">
          Temukan kategori anime favoritmu di SARAFILM
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className={`neo-card ${cat.color} flex flex-col items-center justify-center py-20 gap-8 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all`}
          >
            <div className="bg-black text-white p-6 neo-border neo-shadow-sm rotate-6">
              {cat.icon}
            </div>
            <span className="text-4xl font-black uppercase tracking-tighter italic">{cat.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-20 neo-card bg-black text-white p-12 md:p-24 text-center flex flex-col gap-10 transform -rotate-1">
        <h2 className="text-4xl md:text-8xl font-black uppercase tracking-tighter italic leading-none drop-shadow-[4px_4px_0px_var(--neo-pink)]">FITUR LAIN <br />SEGERA HADIR!</h2>
        <p className="font-black text-2xl uppercase opacity-60">Sabar ya, SARAFILM lagi digodok biar makin brutal!</p>
        <div className="flex justify-center gap-4">
          <div className="w-12 h-12 bg-[var(--neo-yellow)] neo-border" />
          <div className="w-12 h-12 bg-[var(--neo-blue)] neo-border" />
          <div className="w-12 h-12 bg-[var(--neo-green)] neo-border" />
        </div>
      </div>
    </div>
  );
}
