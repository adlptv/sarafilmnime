import axios from "axios";
import { parse } from "node-html-parser";
import type { AnimeCard, Pagination, AnimeDetail, Episode, StreamData } from "./types";

const OTAKUDESU_URL = process.env.NEXT_PUBLIC_OTAKUDESU_URL || "https://otakudesu.cloud";

const client = axios.create({
  baseURL: OTAKUDESU_URL,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": OTAKUDESU_URL,
  },
});

export const getOngoingAnime = async (page = 1): Promise<{ data: AnimeCard[]; pagination: Pagination }> => {
  try {
    const { data } = await client.get(`/ongoing-anime/page/${page}/`);
    const root = parse(data);
    const animeList: AnimeCard[] = [];

    const items = root.querySelectorAll(".venz .detpost");
    items.forEach((item) => {
      const title = item.querySelector(".jdlflm")?.text.trim() || "";
      const poster = item.querySelector("img")?.getAttribute("src") || "";
      const animeId = item.querySelector("a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
      const episodes = item.querySelector(".epz")?.text.trim() || "";
      const latestReleaseDate = item.querySelector(".newz")?.text.trim() || "";
      const releaseDay = item.querySelector(".epztipe")?.text.trim() || "";

      animeList.push({ title, poster, animeId, episodes, latestReleaseDate, releaseDay });
    });

    // Pagination
    const paginationEl = root.querySelector(".pagination");
    const currentPage = page;
    const hasNextPage = !!paginationEl?.querySelector(".next");
    const hasPrevPage = !!paginationEl?.querySelector(".prev");

    return {
      data: animeList,
      pagination: {
        currentPage,
        prevPage: hasPrevPage ? page - 1 : null,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        hasNextPage,
        totalPages: 0,
      },
    };
  } catch (error) {
    console.error("Error fetching ongoing anime:", error);
    return { data: [], pagination: { currentPage: page, prevPage: null, hasPrevPage: false, nextPage: null, hasNextPage: false, totalPages: 0 } };
  }
};

export const getAnimeDetail = async (animeId: string): Promise<AnimeDetail | null> => {
  try {
    const { data } = await client.get(`/anime/${animeId}/`);
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

    // More reliable episode list parsing
    const episodeContainers = root.querySelectorAll(".episodelist");
    episodeContainers.forEach((container) => {
        // Skip "Batch" container
        if (container.text.toLowerCase().includes("batch")) return;
        
        const list = container.querySelectorAll("ul li");
        list.forEach((li) => {
            const epTitle = li.querySelector("a")?.text.trim() || "";
            const epId = li.querySelector("a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
            const uploadedDate = li.querySelector(".zeebr")?.text.trim() || "";
            
            // Only add if it's an episode link (contains "episode")
            if (epId && epId.includes("episode") && !detail.episodes.find((e: any) => e.episodeId === epId)) {
                detail.episodes.push({ title: epTitle, episodeId: epId, uploadedDate });
            }
        });
    });

    // Fallback if no episodes found yet
    if (detail.episodes.length === 0) {
        const allLists = root.querySelectorAll("ul");
        for (const ul of allLists) {
            const items = ul.querySelectorAll("li");
            if (items.length > 3) { // Usually episode lists are long
                const firstLi = items[0];
                const link = firstLi.querySelector("a")?.getAttribute("href") || "";
                if (link.includes("/episode/")) {
                    items.forEach((li) => {
                        const epTitle = li.querySelector("a")?.text.trim() || "";
                        const epId = li.querySelector("a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
                        const uploadedDate = li.querySelector(".zeebr")?.text.trim() || "";
                        if (epId && !detail.episodes.find((e: any) => e.episodeId === epId)) {
                            detail.episodes.push({ title: epTitle, episodeId: epId, uploadedDate });
                        }
                    });
                    break;
                }
            }
        }
    }

    return detail;
  } catch (error) {
    console.error("Error fetching anime detail:", error);
    return null;
  }
};

export const getEpisodeStream = async (episodeId: string): Promise<StreamData | null> => {
  try {
    const { data } = await client.get(`/episode/${episodeId}/`);
    const root = parse(data);

    const title = root.querySelector(".venutama h1")?.text.trim() || "";
    
    // Find animeId from breadcrumbs or links that point to /anime/
    let animeId = "";
    const links = root.querySelectorAll(".venutama a");
    for (const link of links) {
        const href = link.getAttribute("href") || "";
        if (href.includes("/anime/")) {
            animeId = href.split("/").filter(Boolean).pop() || "";
            break;
        }
    }
    
    // Try multiple selectors for the video player
    let iframeSrc = root.querySelector(".responsive-embed-container iframe")?.getAttribute("src") || "";
    
    if (!iframeSrc) {
      // Look for mirror streams if main is empty
      const mirrors = root.querySelectorAll(".mirrorstream ul li a");
      if (mirrors.length > 0) {
        // This usually needs more logic to decode, but let's try to find a direct iframe if present
        iframeSrc = root.querySelector("#pembed iframe")?.getAttribute("src") || "";
      }
    }

    if (!iframeSrc) {
        // Log the root HTML if no iframe is found
        // console.log("No iframe found in:", root.toString().slice(0, 1000));
        
        // Sometimes it's inside #pembed
        const pembed = root.querySelector("#pembed iframe");
        if (pembed) iframeSrc = pembed.getAttribute("src") || "";
    }
    
    // Some episodes have a specific mirror container
    if (!iframeSrc) {
        // Check for any iframe inside the main content area
        iframeSrc = root.querySelector(".venutama iframe")?.getAttribute("src") || "";
    }
    
    if (!iframeSrc) {
        // Try looking for the first mirror URL if available
        const firstMirror = root.querySelector(".mirrorstream ul li a")?.getAttribute("href");
        if (firstMirror) {
            // This is often a base64 string that needs to be resolved
            // But sometimes it's a direct URL
        }
    }

    // Download links
    let downloadSections = root.querySelectorAll(".download ul li");
    if (downloadSections.length === 0) {
        // Alternative download selector
        downloadSections = root.querySelectorAll(".download-content ul li");
    }
    
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

    if (iframeSrc.startsWith("//")) {
        iframeSrc = `https:${iframeSrc}`;
    }

    return {
      title,
      animeId,
      episodeId,
      streamUrl: iframeSrc,
      downloadLinks,
      prevEpisodeId,
      nextEpisodeId,
    };
  } catch (error) {
    console.error("Error fetching episode stream:", error);
    return null;
  }
};

export const searchAnime = async (query: string): Promise<AnimeCard[]> => {
  try {
    const { data } = await client.get(`/?s=${encodeURIComponent(query)}&post_type=anime`);
    const root = parse(data);
    const animeList: AnimeCard[] = [];

    const items = root.querySelectorAll(".chivsrc li");
    items.forEach((item) => {
      const title = item.querySelector("h2 a")?.text.trim() || "";
      const poster = item.querySelector("img")?.getAttribute("src") || "";
      const animeId = item.querySelector("h2 a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
      
      const meta = item.querySelectorAll(".set");
      let type = "";
      let status = "";
      let score = "";
      
      meta.forEach(m => {
          const text = m.text.trim();
          if(text.includes("Status")) status = text.split(":")[1]?.trim();
          else if(text.includes("Rating")) score = text.split(":")[1]?.trim();
          else if(text.includes("Tipe")) type = text.split(":")[1]?.trim();
      });

      animeList.push({ title, poster, animeId, type, score });
    });

    return animeList;
  } catch (error) {
    console.error("Error searching anime:", error);
    return [];
  }
};
