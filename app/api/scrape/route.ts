import { NextRequest, NextResponse } from "next/server";
import { parse } from "node-html-parser";

// Edge runtime uses different IP ranges from serverless functions
// This may bypass Cloudflare blocking
export const runtime = "edge";

const MIRROR_URLS = [
    "https://otakudesu.best",
    "https://otakudesu.io",
    "https://otakudesu.cloud",
    "https://otakudesu.cam",
];

const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
];

async function fetchPage(url: string, ua: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": ua,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
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

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "anime";
    const id = searchParams.get("id") || "";

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    let lastError = "";

    for (const mirror of MIRROR_URLS) {
        try {
            let path = "";
            if (type === "anime") path = `/anime/${id}/`;
            else if (type === "episode") path = `/episode/${id}/`;

            const html = await fetchPage(`${mirror}${path}`, ua);

            if (type === "anime") {
                const data = parseAnimeDetail(html, id);
                if (data.title) {
                    return NextResponse.json({ ok: true, data, mirror }, {
                        headers: { "Cache-Control": "public, s-maxage=300" }
                    });
                }
            } else if (type === "episode") {
                const data = parseEpisode(html, id);
                return NextResponse.json({ ok: true, data, mirror }, {
                    headers: { "Cache-Control": "public, s-maxage=60" }
                });
            }
        } catch (e: any) {
            lastError = e.message;
            console.warn(`[edge-scraper] ❌ ${mirror}: ${e.message}`);
        }
    }

    return NextResponse.json({ ok: false, error: lastError }, { status: 502 });
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

    const episodeContainers = root.querySelectorAll(".episodelist");
    episodeContainers.forEach((container) => {
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
