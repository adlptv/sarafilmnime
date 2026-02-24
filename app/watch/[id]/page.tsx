import { getEpisodeStream, getAnimeDetail } from "@/lib/otakudesu";
import Link from "next/link";
import { Play, SkipBack, SkipForward, Download, ChevronLeft, Calendar, Info, Zap } from "lucide-react";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stream = await getEpisodeStream(id);

  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center p-6">
        <h1 className="text-5xl font-black text-black uppercase italic">Episode Tidak Ditemukan!</h1>
        <Link href="/" className="neo-btn bg-[var(--neo-yellow)] px-12 py-4 text-xl">
          Kembali Ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-10 px-6 md:px-20 max-w-7xl mx-auto">
      <Link href={`/anime/${stream.animeId}`} className="flex items-center gap-2 text-lg font-black text-black uppercase hover:translate-x-[-4px] transition-transform w-fit">
        <ChevronLeft size={24} /> Back to Detail
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Video Player Container */}
          <div className="neo-card bg-black aspect-video p-0 overflow-hidden relative rotate-1">
            {stream.streamUrl ? (
              <iframe
                src={stream.streamUrl}
                className="w-full h-full"
                allowFullScreen
                title={stream.title}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-white bg-black">
                <Play size={100} className="text-[var(--neo-yellow)]" fill="currentColor" />
                <p className="font-black text-2xl uppercase tracking-widest text-white/50">Video Tidak Tersedia</p>
              </div>
            )}
          </div>

          {/* Info & Controls */}
          <div className="neo-card bg-white flex flex-col gap-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-4 border-black pb-8">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter italic leading-none">
                  {stream.title}
                </h1>
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                  <span className="bg-[var(--neo-pink)] neo-border px-3 py-1">Now Playing</span>
                  <span className="opacity-50">ID: {stream.episodeId}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                {stream.prevEpisodeId && (
                  <Link
                    href={`/watch/${stream.prevEpisodeId}`}
                    className="neo-btn bg-white p-4"
                  >
                    <SkipBack size={24} fill="currentColor" />
                  </Link>
                )}
                {stream.nextEpisodeId && (
                  <Link
                    href={`/watch/${stream.nextEpisodeId}`}
                    className="neo-btn bg-[var(--neo-yellow)] p-4 flex items-center gap-2"
                  >
                    <span className="font-black uppercase hidden md:inline">Next</span>
                    <SkipForward size={24} fill="currentColor" />
                  </Link>
                )}
              </div>
            </div>

            {/* Download Section */}
            <div className="flex flex-col gap-8">
              <h3 className="text-3xl font-black text-black uppercase tracking-tighter flex items-center gap-3 italic">
                <Download size={32} className="text-[var(--neo-blue)]" /> Link Download
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stream.downloadLinks.map((dl) => (
                  <div key={dl.quality} className="neo-card bg-[var(--neo-green)]/10 p-6 flex flex-col gap-4">
                    <span className="text-sm font-black text-black uppercase tracking-widest bg-white border-2 border-black w-fit px-3 py-1">{dl.quality}</span>
                    <div className="flex flex-wrap gap-3">
                      {dl.links.map((link) => (
                        <a
                          key={link.provider}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neo-btn bg-white text-xs py-2 px-4"
                        >
                          {link.provider}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          <h3 className="text-3xl font-black text-black uppercase tracking-tighter flex items-center gap-3 italic">
            <Info size={32} className="text-[var(--neo-purple)]" /> Info Anime
          </h3>
          <AnimeInfoSidebar animeId={stream.animeId} currentEpisodeId={stream.episodeId} />
        </div>
      </div>
    </div>
  );
}

async function AnimeInfoSidebar({ animeId, currentEpisodeId }: { animeId: string; currentEpisodeId: string }) {
  const anime = await getAnimeDetail(animeId);
  if (!anime) return null;

  return (
    <div className="flex flex-col gap-10">
      <Link href={`/anime/${animeId}`} className="group neo-card p-0 overflow-hidden block hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
        {anime.poster ? (
          <img src={anime.poster} alt={anime.title} className="w-full aspect-[3/4] object-cover grayscale group-hover:grayscale-0 transition-all" />
        ) : (
          <div className="w-full aspect-[3/4] bg-white flex items-center justify-center">
            <Play size={48} className="text-black/10" />
          </div>
        )}
        <div className="p-6 bg-white border-t-4 border-black font-black text-lg uppercase leading-tight line-clamp-2 group-hover:bg-[var(--neo-yellow)] transition-colors">
          {anime.title}
        </div>
      </Link>

      <div className="flex flex-col gap-6">
        <h3 className="text-lg font-black text-black uppercase tracking-widest flex items-center gap-2 border-b-8 border-black pb-4">
          <Calendar size={24} /> Semua Episode
        </h3>
        <div className="flex flex-col gap-4 max-h-[100vh] lg:max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {anime.episodes.map((ep, idx) => (
            <Link
              key={ep.episodeId}
              href={`/watch/${ep.episodeId}`}
              className={`neo-card p-4 flex items-center gap-4 transition-all ${ep.episodeId === currentEpisodeId
                  ? "bg-[var(--neo-pink)] translate-x-1 translate-y-1 shadow-none"
                  : "bg-white hover:bg-[var(--neo-yellow)]"
                }`}
            >
              <div className="w-10 h-10 neo-border bg-black text-white flex items-center justify-center font-black text-sm shrink-0">
                {anime.episodes.length - idx}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="font-black text-sm uppercase line-clamp-1 leading-none mb-1">{ep.title}</div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-50">{ep.uploadedDate}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
