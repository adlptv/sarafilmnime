import axios from "axios";
import { parse } from "node-html-parser";
import type { AnimeCard, Pagination, AnimeDetail, Episode, StreamData, DownloadLink } from "./types";

// ============================================================
// MODE 1: REST API (Wajik Anime API) — digunakan jika ANIME_API_URL tersedia
// Deploy Wajik Anime API ke Railway/Render, lalu set ANIME_API_URL di Vercel
// ============================================================
const _rawApiUrl = process.env.ANIME_API_URL || "";
const ANIME_API_URL = _rawApiUrl
  ? (_rawApiUrl.startsWith("http") ? _rawApiUrl : `https://${_rawApiUrl}`).replace(/\/$/, "")
  : "";

// ============================================================
// MODE 2: Direct Scraping (fallback, works on localhost)
// ============================================================
const MIRROR_URLS: string[] = (() => {
  const envUrls = process.env.OTAKUDESU_URLS || process.env.NEXT_PUBLIC_OTAKUDESU_URL || "";
  const defaults = [
    "https://otakudesu.best",
    "https://otakudesu.io",
    "https://otakudesu.cloud",
    "https://otakudesu.cam",
    "https://otakudesu.wtf",
  ];
  if (envUrls.trim()) {
    return envUrls.split(",").map(u => u.trim().replace(/\/$/, "")).filter(Boolean);
  }
  return defaults;
})();

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
];

async function fetchWithFallback(path: string): Promise<string> {
  let lastError: any = null;
  for (const mirror of MIRROR_URLS) {
    try {
      const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const { data } = await axios.get(`${mirror}${path}`, {
        timeout: 12000,
        maxRedirects: 5,
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
          "Referer": mirror + "/",
        },
      });
      return data;
    } catch (err: any) {
      console.warn(`[scraper] ❌ ${mirror}${path}: ${err?.response?.status || err.message}`);
      lastError = err;
    }
  }
  throw lastError || new Error("All mirror URLs failed");
}

// ============================================================
// Helper: Call REST API
// ============================================================
async function callApi(endpoint: string): Promise<any> {
  const res = await axios.get(`${ANIME_API_URL}${endpoint}`, { timeout: 10000 });
  return res.data?.data ?? res.data;
}

// ============================================================
// EXPORTED FUNCTIONS
// ============================================================

export const getOngoingAnime = async (page = 1): Promise<{ data: AnimeCard[]; pagination: Pagination }> => {
  // — REST API mode —
  if (ANIME_API_URL) {
    try {
      const json = await callApi(`/otakudesu/ongoing?page=${page}`);
      const animeList: AnimeCard[] = (json.animeList ?? []).map((a: any) => ({
        title: a.title,
        poster: a.poster,
        animeId: a.animeId,
        episodes: a.episodes,
        latestReleaseDate: a.latestReleaseDate,
        releaseDay: a.releaseDay,
      }));
      return { data: animeList, pagination: json.pagination ?? { currentPage: page, prevPage: null, hasPrevPage: false, nextPage: null, hasNextPage: false, totalPages: 0 } };
    } catch (error) {
      console.error("[api] getOngoingAnime failed:", error);
      return { data: [], pagination: { currentPage: page, prevPage: null, hasPrevPage: false, nextPage: null, hasNextPage: false, totalPages: 0 } };
    }
  }

  // — Scraping mode —
  try {
    const data = await fetchWithFallback(`/ongoing-anime/page/${page}/`);
    const root = parse(data);
    const animeList: AnimeCard[] = [];

    const items = root.querySelectorAll(".venz .detpost");
    items.forEach((item) => {
      const title = item.querySelector(".jdlflm")?.text.trim() || "";
      const poster = item.querySelector("img")?.getAttribute("src") || "";
      const links = item.querySelectorAll("a");
      let animeId = "";
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (href.includes("/anime/")) {
          animeId = href.split("/").filter(Boolean).pop() || "";
          break;
        }
      }
      if (!animeId) {
        const firstHref = links[0]?.getAttribute("href") || "";
        animeId = firstHref.split("/").filter(Boolean).pop() || "";
      }
      const episodes = item.querySelector(".epz")?.text.trim() || "";
      const latestReleaseDate = item.querySelector(".newz")?.text.trim() || "";
      const releaseDay = item.querySelector(".epztipe")?.text.trim() || "";
      animeList.push({ title, poster, animeId, episodes, latestReleaseDate, releaseDay });
    });

    const paginationEl = root.querySelector(".pagination");
    const hasNextPage = !!paginationEl?.querySelector(".next");
    const hasPrevPage = !!paginationEl?.querySelector(".prev");
    return {
      data: animeList,
      pagination: { currentPage: page, prevPage: hasPrevPage ? page - 1 : null, hasPrevPage, nextPage: hasNextPage ? page + 1 : null, hasNextPage, totalPages: 0 },
    };
  } catch (error) {
    console.error("Error fetching ongoing anime:", error);
    return { data: [], pagination: { currentPage: page, prevPage: null, hasPrevPage: false, nextPage: null, hasNextPage: false, totalPages: 0 } };
  }
};

export const getAnimeDetail = async (animeId: string): Promise<AnimeDetail | null> => {
  // — REST API mode —
  if (ANIME_API_URL) {
    try {
      const json = await callApi(`/otakudesu/anime/${animeId}`);
      return {
        title: json.title || "",
        poster: json.poster || "",
        japaneseTitle: json.japaneseTitle,
        score: json.score,
        producer: json.producer,
        type: json.type,
        status: json.status,
        totalEpisodes: json.totalEpisodes,
        duration: json.duration,
        releaseDate: json.releaseDate,
        studio: json.studio,
        genre: json.genre,
        synopsis: json.synopsis || json.sinopsis,
        episodes: (json.episodeList ?? json.episodes ?? []).map((e: any) => ({
          title: e.title,
          episodeId: e.episodeId,
          uploadedDate: e.uploadedDate,
        })),
      };
    } catch (error) {
      console.error("[api] getAnimeDetail failed:", error);
      return null;
    }
  }

  // — Scraping mode —
  try {
    const data = await fetchWithFallback(`/anime/${animeId}/`);
    const root = parse(data);

    const title = root.querySelector(".jdlx h1")?.text.trim() || root.querySelector(".infozin h1")?.text.trim() || "";
    const poster = root.querySelector(".fotoanime img")?.getAttribute("src") || root.querySelector(".infozin img")?.getAttribute("src") || "";
    const synopsis = root.querySelector(".sinopc")?.text.trim() || root.querySelector(".sinopsis")?.text.trim() || "";

    const info = root.querySelectorAll(".infozin .infozingle p");
    const detail: any = { title, poster, synopsis, episodes: [] };

    info.forEach((p) => {
      const text = p.text.trim();
      if (text.includes("Judul Jepang")) detail.japaneseTitle = text.split(":")[1]?.trim();
      if (text.includes("Skor")) detail.score = text.split(":")[1]?.trim();
      if (text.includes("Produser")) detail.producer = text.split(":")[1]?.trim();
      if (text.includes("Tipe")) detail.type = text.split(":")[1]?.trim();
      if (text.includes("Status")) detail.status = text.split(":")[1]?.trim();
      if (text.includes("Total Episode")) detail.totalEpisodes = text.split(":")[1]?.trim();
      if (text.includes("Durasi")) detail.duration = text.split(":")[1]?.trim();
      if (text.includes("Tanggal Rilis")) detail.releaseDate = text.split(":")[1]?.trim();
      if (text.includes("Studio")) detail.studio = text.split(":")[1]?.trim();
      if (text.includes("Genre")) detail.genre = text.split(":")[1]?.trim();
    });

    const episodeContainers = root.querySelectorAll(".episodelist");
    episodeContainers.forEach((container) => {
      if (container.text.toLowerCase().includes("batch")) return;
      const list = container.querySelectorAll("ul li");
      list.forEach((li) => {
        const epTitle = li.querySelector("a")?.text.trim() || "";
        const epId = li.querySelector("a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
        const uploadedDate = li.querySelector(".zeebr")?.text.trim() || "";
        if (epId && epId.includes("episode") && !detail.episodes.find((e: any) => e.episodeId === epId)) {
          detail.episodes.push({ title: epTitle, episodeId: epId, uploadedDate });
        }
      });
    });

    return detail;
  } catch (error) {
    console.error("Error fetching anime detail:", error);
    return null;
  }
};

export const getEpisodeStream = async (episodeId: string): Promise<StreamData | null> => {
  // — REST API mode —
  if (ANIME_API_URL) {
    try {
      const json = await callApi(`/otakudesu/episode/${episodeId}`);
      return {
        title: json.title || "",
        animeId: json.animeId || "",
        episodeId,
        streamUrl: json.streamUrl || json.iframe || "",
        downloadLinks: (json.downloadLinks ?? json.downloads ?? []).map((d: any) => ({
          quality: d.quality,
          links: d.links,
        })),
        prevEpisodeId: json.prevEpisodeId || null,
        nextEpisodeId: json.nextEpisodeId || null,
      };
    } catch (error) {
      console.error("[api] getEpisodeStream failed:", error);
      return null;
    }
  }

  // — Scraping mode —
  try {
    const data = await fetchWithFallback(`/episode/${episodeId}/`);
    const root = parse(data);

    const title = root.querySelector(".venutama h1")?.text.trim() || "";
    let animeId = "";
    const links = root.querySelectorAll(".venutama a");
    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (href.includes("/anime/")) {
        animeId = href.split("/").filter(Boolean).pop() || "";
        break;
      }
    }

    let iframeSrc =
      root.querySelector(".responsive-embed-container iframe")?.getAttribute("src") ||
      root.querySelector("#pembed iframe")?.getAttribute("src") ||
      root.querySelector(".venutama iframe")?.getAttribute("src") ||
      "";

    if (iframeSrc.startsWith("//")) iframeSrc = `https:${iframeSrc}`;

    let downloadSections = root.querySelectorAll(".download ul li");
    if (downloadSections.length === 0) downloadSections = root.querySelectorAll(".download-content ul li");

    const downloadLinks: DownloadLink[] = [];
    downloadSections.forEach((li) => {
      const quality = li.querySelector("strong")?.text.trim() || li.querySelector("b")?.text.trim() || "";
      const links: any[] = [];
      li.querySelectorAll("a").forEach((a) => {
        links.push({ provider: a.text.trim(), url: a.getAttribute("href") || "" });
      });
      if (quality && links.length > 0) downloadLinks.push({ quality, links });
    });

    const nav = root.querySelectorAll(".flir a");
    let prevEpisodeId = null;
    let nextEpisodeId = null;
    nav.forEach((a) => {
      const href = a.getAttribute("href");
      if (a.text.includes("Next")) nextEpisodeId = href?.split("/").filter(Boolean).pop() || null;
      if (a.text.includes("Prev")) prevEpisodeId = href?.split("/").filter(Boolean).pop() || null;
    });

    return { title, animeId, episodeId, streamUrl: iframeSrc, downloadLinks, prevEpisodeId, nextEpisodeId };
  } catch (error) {
    console.error("Error fetching episode stream:", error);
    return null;
  }
};

export const searchAnime = async (query: string): Promise<AnimeCard[]> => {
  // — REST API mode —
  if (ANIME_API_URL) {
    try {
      const json = await callApi(`/otakudesu/search?q=${encodeURIComponent(query)}`);
      return (json.animeList ?? json ?? []).map((a: any) => ({
        title: a.title,
        poster: a.poster,
        animeId: a.animeId,
        type: a.type,
        score: a.score,
      }));
    } catch (error) {
      console.error("[api] searchAnime failed:", error);
      return [];
    }
  }

  // — Scraping mode —
  try {
    const data = await fetchWithFallback(`/?s=${encodeURIComponent(query)}&post_type=anime`);
    const root = parse(data);
    const animeList: AnimeCard[] = [];

    const items = root.querySelectorAll(".chivsrc li");
    items.forEach((item) => {
      const title = item.querySelector("h2 a")?.text.trim() || "";
      const poster = item.querySelector("img")?.getAttribute("src") || "";
      const animeId = item.querySelector("h2 a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
      const meta = item.querySelectorAll(".set");
      let type = "", status = "", score = "";
      meta.forEach(m => {
        const text = m.text.trim();
        if (text.includes("Status")) status = text.split(":")[1]?.trim();
        else if (text.includes("Rating")) score = text.split(":")[1]?.trim();
        else if (text.includes("Tipe")) type = text.split(":")[1]?.trim();
      });
      animeList.push({ title, poster, animeId, type, score });
    });

    return animeList;
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
};
