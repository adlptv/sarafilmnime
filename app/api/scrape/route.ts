import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

export const runtime = "edge";

const ZENROWS_KEY = process.env.ZENROWS_API_KEY || "";
const SCRAPINGBEE_KEY = process.env.SCRAPINGBEE_API_KEY || "";

const MIRROR_URLS = [
    "https://otakudesu.best",
    "https://otakudesu.io",
    "https://otakudesu.cloud",
    "https://otakudesu.cam",
];

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
];

async function fetchViaZenRows(url: string): Promise<string> {
    const apiUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_KEY}&url=${encodeURIComponent(url)}&js_render=true&premium_proxy=true`;
    const res = await fetch(apiUrl, { headers: { "Accept": "text/html" } });
    if (!res.ok) throw new Error(`ZenRows HTTP ${res.status}`);
    return await res.text();
}

async function fetchViaScrapingBee(url: string): Promise<string> {
    const apiUrl = `https://app.scrapingbee.com/api/v1/?api_key=${SCRAPINGBEE_KEY}&url=${encodeURIComponent(url)}&render_js=true&block_ads=true&block_resources=false`;
    const res = await fetch(apiUrl, { headers: { "Accept": "text/html" } });
    if (!res.ok) throw new Error(`ScrapingBee HTTP ${res.status}`);
    return await res.text();
}

async function fetchDirect(url: string, ua: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": ua,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Sec-Fetch-User": "?1",
                "Cache-Control": "max-age=0",
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchPage(path: string): Promise<{ html: string; source: string }> {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // 1. ScrapingBee (bypasses Cloudflare)
    if (SCRAPINGBEE_KEY) {
        for (const mirror of MIRROR_URLS) {
            try {
                const html = await fetchViaScrapingBee(`${mirror}${path}`);
                return { html, source: `scrapingbee:${mirror}` };
            } catch (e: any) {
                console.warn(`[ScrapingBee] ❌ ${mirror}: ${e.message}`);
            }
        }
    }

    // 2. ZenRows (alternative bypass)
    if (ZENROWS_KEY) {
        for (const mirror of MIRROR_URLS) {
            try {
                const html = await fetchViaZenRows(`${mirror}${path}`);
                return { html, source: `zenrows:${mirror}` };
            } catch (e: any) {
                console.warn(`[ZenRows] ❌ ${mirror}: ${e.message}`);
            }
        }
    }

    // 3. Direct fetch (works on localhost or non-CF-protected pages)
    for (const mirror of MIRROR_URLS) {
        try {
            const html = await fetchDirect(`${mirror}${path}`, ua);
            return { html, source: `direct:${mirror}` };
        } catch (e: any) {
            console.warn(`[direct] ❌ ${mirror}: ${e.message}`);
        }
    }

    throw new Error(
        (SCRAPINGBEE_KEY || ZENROWS_KEY)
            ? "All scraping API + direct attempts failed"
            : "All direct attempts failed. Set SCRAPINGBEE_API_KEY or ZENROWS_API_KEY to bypass Cloudflare."
    );
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "anime";
    const id = searchParams.get("id") || "";

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const path = type === "anime" ? `/anime/${id}/` : `/episode/${id}/`;

    try {
        const { html, source } = await fetchPage(path);

        const data = type === "anime" ? parseAnimeDetail(html, id) : parseEpisode(html, id);

        if (type === "anime" && !(data as any).title) {
            return NextResponse.json({ ok: false, error: "Parsed but no title found", source }, { status: 502 });
        }

        return NextResponse.json({ ok: true, data, source }, {
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
    }
}

function parseAnimeDetail(html: string, animeId: string) {
    const root = parse(html);
    const title = root.querySelector(".jdlx h1")?.text.trim() || root.querySelector(".infozin h1")?.text.trim() || "";
    const poster = root.querySelector(".fotoanime img")?.getAttribute("src") || root.querySelector(".infozin img")?.getAttribute("src") || "";
    const synopsis = root.querySelector(".sinopc")?.text.trim() || root.querySelector(".sinopsis")?.text.trim() || "";

    const info = root.querySelectorAll(".infozin .infozingle p");
    const detail: any = { title, poster, synopsis, animeId, episodes: [] };

    info.forEach((p) => {
        const text = p.text.trim();
        if (text.includes("Judul Jepang")) detail.japaneseTitle = text.split(":")[1]?.trim();
        if (text.includes("Skor")) detail.score = text.split(":")[1]?.trim();
        if (text.includes("Tipe")) detail.type = text.split(":")[1]?.trim();
        if (text.includes("Status")) detail.status = text.split(":")[1]?.trim();
        if (text.includes("Total Episode")) detail.totalEpisodes = text.split(":")[1]?.trim();
        if (text.includes("Durasi")) detail.duration = text.split(":")[1]?.trim();
        if (text.includes("Tanggal Rilis")) detail.releaseDate = text.split(":")[1]?.trim();
        if (text.includes("Studio")) detail.studio = text.split(":")[1]?.trim();
        if (text.includes("Genre")) detail.genre = text.split(":")[1]?.trim();
        if (text.includes("Produser")) detail.producer = text.split(":")[1]?.trim();
    });

    root.querySelectorAll(".episodelist").forEach((container) => {
        if (container.text.toLowerCase().includes("batch")) return;
        container.querySelectorAll("ul li").forEach((li) => {
            const epTitle = li.querySelector("a")?.text.trim() || "";
            const epId = li.querySelector("a")?.getAttribute("href")?.split("/").filter(Boolean).pop() || "";
            const uploadedDate = li.querySelector(".zeebr")?.text.trim() || "";
            if (epId && epId.includes("episode") && !detail.episodes.find((e: any) => e.episodeId === epId)) {
                detail.episodes.push({ title: epTitle, episodeId: epId, uploadedDate });
            }
        });
    });

    return detail;
}

function parseEpisode(html: string, episodeId: string) {
    const root = parse(html);
    const title = root.querySelector(".venutama h1")?.text.trim() || "";
    let animeId = "";
    for (const link of root.querySelectorAll(".venutama a")) {
        const href = link.getAttribute("href") || "";
        if (href.includes("/anime/")) { animeId = href.split("/").filter(Boolean).pop() || ""; break; }
    }

    let iframeSrc = root.querySelector(".responsive-embed-container iframe")?.getAttribute("src")
        || root.querySelector("#pembed iframe")?.getAttribute("src")
        || root.querySelector(".venutama iframe")?.getAttribute("src")
        || "";
    if (iframeSrc.startsWith("//")) iframeSrc = `https:${iframeSrc}`;

    const downloadLinks: any[] = [];
    root.querySelectorAll(".download ul li, .download-content ul li").forEach((li) => {
        const quality = li.querySelector("strong")?.text.trim() || li.querySelector("b")?.text.trim() || "";
        const links: any[] = [];
        li.querySelectorAll("a").forEach((a) => links.push({ provider: a.text.trim(), url: a.getAttribute("href") || "" }));
        if (quality && links.length > 0) downloadLinks.push({ quality, links });
    });

    let prevEpisodeId = null, nextEpisodeId = null;
    root.querySelectorAll(".flir a").forEach((a) => {
        const href = a.getAttribute("href");
        if (a.text.includes("Next")) nextEpisodeId = href?.split("/").filter(Boolean).pop() || null;
        if (a.text.includes("Prev")) prevEpisodeId = href?.split("/").filter(Boolean).pop() || null;
    });

    return { title, animeId, episodeId, streamUrl: iframeSrc, downloadLinks, prevEpisodeId, nextEpisodeId };
}
