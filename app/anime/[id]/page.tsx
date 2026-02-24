import { getAnimeDetail } from "@/lib/otakudesu";
import Link from "next/link";
import { Play, Star, Clock, Tv, Film, Info, Calendar, ChevronLeft, Zap } from "lucide-react";

export default async function AnimeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const anime = await getAnimeDetail(id);

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center p-6">
        <h1 className="text-5xl font-black text-black uppercase italic">Anime Tidak Ditemukan!</h1>
        <Link href="/" className="neo-btn bg-[var(--neo-yellow)] px-12 py-4 text-xl">
          Kembali Ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12 py-10 px-6 md:px-20 max-w-7xl mx-auto">
      <Link href="/" className="flex items-center gap-2 text-lg font-black text-black uppercase hover:translate-x-[-4px] transition-transform w-fit">
        <ChevronLeft size={24} /> Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Poster Column */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="neo-card p-0 overflow-hidden aspect-[3/4] rotate-1">
            {anime.poster ? (
              <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover grayscale active:grayscale-0" />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center">
                <Play size={80} className="text-black/10" />
              </div>
            )}
            <div className="absolute top-6 right-6 bg-white neo-border neo-shadow-sm px-4 py-2 font-black text-xl flex items-center gap-2">
              <Star size={24} fill="currentColor" /> {anime.score}
            </div>
          </div>

          <div className="neo-card bg-[var(--neo-blue)] flex flex-col gap-6">
            <div className="flex justify-between items-center text-lg font-black uppercase">
              <span>Status</span>
              <span className="bg-black text-white px-2 py-1">{anime.status}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-black uppercase border-t-2 border-black pt-4">
              <span>Tipe</span>
              <span>{anime.type}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-black uppercase border-t-2 border-black pt-4">
              <span>Studio</span>
              <span className="line-clamp-1">{anime.studio}</span>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] italic">
              {anime.title}
            </h1>
            <p className="text-xl font-bold text-black/60 uppercase tracking-widest">
              {anime.japaneseTitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            {anime.genre?.split(",").map((g) => (
              <span key={g} className="bg-white neo-border px-6 py-2 font-black text-sm uppercase hover:bg-[var(--neo-pink)] transition-colors cursor-default">
                {g.trim()}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="neo-card bg-[var(--neo-yellow)] p-6 flex flex-col items-center text-center gap-2 transform -rotate-2">
              <Tv size={28} />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Episode</span>
              <span className="text-2xl font-black">{anime.totalEpisodes}</span>
            </div>
            <div className="neo-card bg-[var(--neo-green)] p-6 flex flex-col items-center text-center gap-2 transform rotate-1">
              <Clock size={28} />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Durasi</span>
              <span className="text-lg font-black leading-tight">{anime.duration}</span>
            </div>
            <div className="neo-card bg-[var(--neo-blue)] p-6 flex flex-col items-center text-center gap-2 transform -rotate-1">
              <Calendar size={28} />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Rilis</span>
              <span className="text-lg font-black leading-tight">{anime.releaseDate}</span>
            </div>
            <div className="neo-card bg-[var(--neo-purple)] p-6 flex flex-col items-center text-center gap-2 transform rotate-2">
              <Film size={28} />
              <span className="text-xs font-black uppercase tracking-widest opacity-60">Studio</span>
              <span className="text-xs font-black leading-tight uppercase line-clamp-2">{anime.studio}</span>
            </div>
          </div>

          <div className="neo-card bg-white flex flex-col gap-6 relative">
            <div className="absolute -top-4 -left-4 bg-[var(--neo-pink)] neo-border px-4 py-1 font-black uppercase text-sm">Sinopsis</div>
            <p className="text-xl font-bold leading-snug">
              {anime.synopsis}
            </p>
          </div>
        </div>
      </div>

      {/* Episode List */}
      <section className="flex flex-col gap-12 mt-12">
        <h2 className="text-4xl md:text-5xl font-black text-black uppercase tracking-tighter italic">
          <Zap className="inline-block mr-4 transform -rotate-12 fill-[var(--neo-yellow)]" size={48} />
          Daftar <span className="bg-black text-white px-4 not-italic">Episode</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {anime.episodes.map((ep, idx) => (
            <Link
              key={ep.episodeId}
              href={`/watch/${ep.episodeId}`}
              className="group neo-card p-0 flex flex-col hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
            >
              <div className="p-6 flex items-center gap-6 bg-white group-hover:bg-[var(--neo-yellow)] transition-colors">
                <div className="w-16 h-16 neo-border bg-black text-white flex items-center justify-center font-black text-2xl group-hover:rotate-6 transition-transform">
                  {anime.episodes.length - idx}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-black text-lg uppercase line-clamp-1 leading-none mb-2">{ep.title}</span>
                  <span className="text-xs font-black uppercase opacity-60 tracking-widest">{ep.uploadedDate}</span>
                </div>
                <Play size={24} className="opacity-0 group-hover:opacity-100 transition-opacity" fill="black" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
