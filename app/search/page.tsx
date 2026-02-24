import { searchAnime } from "@/lib/otakudesu";
import Link from "next/link";
import { Search, Star, Play, Home } from "lucide-react";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q: query } = await searchParams;
  const results = query ? await searchAnime(query) : [];

  return (
    <div className="px-6 md:px-20 py-16 flex flex-col gap-12 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 border-b-8 border-black pb-8">
        <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter italic">
          <Search className="inline-block mr-4 transform -rotate-6" size={48} /> {query ? `Hasil: ${query}` : 'Pencarian'}
        </h1>
        <p className="text-xl font-bold text-black uppercase tracking-widest bg-[var(--neo-blue)] px-4 py-1 w-fit neo-border">
          Ditemukan {results.length} anime yang cocok.
        </p>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {results.map((anime) => (
            <Link
              key={anime.animeId}
              href={`/anime/${anime.animeId}`}
              className="group flex flex-col"
            >
              <div className="neo-card p-0 flex flex-col h-full hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                <div className="aspect-[3/4] overflow-hidden border-b-4 border-black relative">
                  {anime.poster ? (
                    <img
                      src={anime.poster}
                      alt={anime.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center">
                      <Play size={48} className="text-black/10" />
                    </div>
                  )}
                  {anime.score && (
                    <div className="absolute top-4 right-4 bg-white neo-border neo-shadow-sm px-3 py-1 font-black text-xs flex items-center gap-1">
                      <Star size={14} fill="currentColor" /> {anime.score}
                    </div>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between bg-white group-hover:bg-[var(--neo-green)] transition-colors">
                  <h3 className="text-xl font-black leading-tight mb-4 uppercase line-clamp-2">
                    {anime.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[10px] uppercase tracking-widest bg-black text-white px-2 py-1">
                      {anime.type}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 gap-8 neo-card bg-white text-center">
          <Search size={80} className="transform rotate-12" />
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black uppercase">Kosong Melompong!</h2>
            <p className="text-xl font-bold">Tidak ada anime yang cocok dengan kata kunci kamu.</p>
          </div>
          <Link href="/" className="neo-btn bg-[var(--neo-yellow)] text-xl py-4 px-12 flex items-center gap-2">
            <Home size={24} /> Balik Beranda
          </Link>
        </div>
      )}
    </div>
  );
}
