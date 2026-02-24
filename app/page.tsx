import { getOngoingAnime } from "@/lib/otakudesu";
import Link from "next/link";
import { Play, Calendar, TrendingUp, ArrowRight, Zap, Star } from "lucide-react";

export default async function Home() {
  const { data: ongoing } = await getOngoingAnime(1);

  return (
    <div className="flex flex-col gap-24 py-12 px-6 md:px-20 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 bg-[var(--neo-pink)] neo-border neo-shadow-sm px-4 py-1 w-fit transform -rotate-1">
            <Zap size={18} fill="black" />
            <span className="font-black uppercase text-sm">Update Terbaru</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.2] md:leading-[1.1] tracking-tighter uppercase italic py-4">
            Nonton Anime <br />
            <span className="text-white bg-black px-6 py-3 not-italic inline-block my-4 transform -rotate-1 shadow-[8px_8px_0px_0px_var(--neo-pink)]">
              Makin Brutal
            </span> <br />
            di SARAFILM
          </h1>

          <p className="text-xl md:text-2xl font-bold max-w-xl leading-tight border-l-8 border-black pl-6 py-2">
            Streaming anime subtitle Indonesia gratis dengan kualitas terbaik dan tanpa gangguan. Update setiap hari, tanpa basa-basi!
          </p>

          <div className="flex flex-wrap gap-6 mt-4">
            <Link
              href={`/anime/${ongoing[0]?.animeId}`}
              className="neo-btn bg-[var(--neo-yellow)] text-xl py-4 flex items-center gap-3"
            >
              Mulai Nonton <Play size={24} fill="black" />
            </Link>
            <Link
              href="/ongoing"
              className="neo-btn bg-white text-xl py-4 flex items-center gap-3"
            >
              Cek Ongoing <Calendar size={24} />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="neo-card bg-[var(--neo-blue)] aspect-[4/5] overflow-hidden group rotate-2 hover:rotate-0">
            {ongoing[0]?.poster ? (
              <img
                src={ongoing[0].poster}
                alt="Featured"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
              />
            ) : (
              <div className="w-full h-full bg-white" />
            )}
            <div className="absolute inset-x-4 bottom-4 neo-card bg-white p-4">
              <h2 className="text-2xl font-black italic uppercase line-clamp-1">{ongoing[0]?.title}</h2>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold uppercase text-xs bg-black text-white px-2 py-0.5">{ongoing[0]?.episodes}</span>
                <span className="font-black text-sm uppercase">{ongoing[0]?.releaseDay}</span>
              </div>
            </div>
          </div>
          <div className="absolute -z-10 -top-6 -right-6 w-full h-full bg-[var(--neo-purple)] neo-border rotate-1" />
        </div>
      </section>

      {/* Ongoing List */}
      <section className="flex flex-col gap-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic">
            Anime <span className="bg-[var(--neo-green)] px-4 neo-border not-italic">Ongoing</span>
          </h2>
          <Link href="/ongoing" className="font-black uppercase text-lg border-b-4 border-black pb-1 flex items-center gap-2 hover:translate-x-2 transition-transform">
            Lihat Semua <ArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {ongoing.slice(0, 12).map((anime, i) => (
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
                <div className="p-6 flex-1 flex flex-col justify-between bg-white group-hover:bg-[var(--neo-yellow)] transition-colors">
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
      </section>

      {/* Newsletter / CTA Section */}
      <section className="neo-card bg-[var(--neo-purple)] p-12 flex flex-col md:flex-row items-center justify-between gap-8 transform -rotate-1">
        <div className="flex flex-col gap-4">
          <h3 className="text-4xl font-black uppercase text-white drop-shadow-[4px_4px_0px_#000]">Jangan Ketinggalan Update!</h3>
          <p className="text-xl font-bold text-black max-w-lg">Gabung komunitas kami dan dapatkan notifikasi langsung saat episode baru rilis.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <input type="text" placeholder="Email kamu..." className="neo-input flex-1 md:w-80" />
          <button className="neo-btn bg-black text-white hover:bg-white hover:text-black">Join Squad</button>
        </div>
      </section>
    </div>
  );
}
