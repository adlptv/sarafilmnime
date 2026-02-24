import { getOngoingAnime } from "@/lib/otakudesu";
import Link from "next/link";
import { Play, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default async function OngoingPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const { data: ongoing, pagination } = await getOngoingAnime(currentPage);

  return (
    <div className="px-6 md:px-20 py-16 flex flex-col gap-16 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl md:text-6xl font-black text-black uppercase tracking-tighter italic">
          <Calendar className="inline-block mr-4 transform -rotate-12" size={48} />
          Anime <span className="bg-[var(--neo-yellow)] px-4 neo-border not-italic">Ongoing</span>
        </h1>
        <p className="text-xl font-bold text-black uppercase tracking-widest border-l-8 border-black pl-4">
          Update anime terbaru setiap hari tanpa henti.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {ongoing.map((anime) => (
          <Link
            key={anime.animeId}
            href={`/anime/${anime.animeId}`}
            className="group flex flex-col"
          >
            <div className="neo-card p-0 flex flex-col h-full hover:-translate-y-2 transition-transform duration-300">
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
                <div className="absolute top-4 right-4 bg-white neo-border neo-shadow-sm px-3 py-1 font-black text-xs uppercase">
                  {anime.episodes}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between bg-white group-hover:bg-[var(--neo-blue)] transition-colors">
                <h3 className="text-xl font-black leading-tight mb-4 uppercase line-clamp-2">
                  {anime.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-black text-[10px] uppercase tracking-widest bg-black text-white px-2 py-1">
                    {anime.releaseDay}
                  </span>
                  <span className="text-[10px] font-black uppercase opacity-60">
                    {anime.latestReleaseDate}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-6 mt-12">
        {pagination.hasPrevPage && (
          <Link
            href={`/ongoing?page=${pagination.prevPage}`}
            className="neo-btn bg-white"
          >
            <ChevronLeft size={32} />
          </Link>
        )}
        <div className="neo-card bg-black text-white w-16 h-16 flex items-center justify-center font-black text-2xl transform rotate-3">
          {pagination.currentPage}
        </div>
        {pagination.hasNextPage && (
          <Link
            href={`/ongoing?page=${pagination.nextPage}`}
            className="neo-btn bg-[var(--neo-yellow)]"
          >
            <ChevronRight size={32} />
          </Link>
        )}
      </div>
    </div>
  );
}
