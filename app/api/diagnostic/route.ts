import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const _rawApiUrl = process.env.ANIME_API_URL || "";
const ANIME_API_URL = _rawApiUrl
    ? (_rawApiUrl.startsWith("http") ? _rawApiUrl : `https://${_rawApiUrl}`).replace(/\/$/, "")
    : "";

export async function GET(request: NextRequest) {
    const results: any = {
        ANIME_API_URL_RAW: _rawApiUrl || "NOT SET ❌",
        ANIME_API_URL_RESOLVED: ANIME_API_URL || "NOT SET ❌",
        timestamp: new Date().toISOString(),
        tests: {},
    };

    if (!ANIME_API_URL) {
        return NextResponse.json(results);
    }

    // Test 1: ongoing
    try {
        const res = await axios.get(`${ANIME_API_URL}/otakudesu/ongoing?page=1`, { timeout: 8000 });
        results.tests.ongoing = { status: res.status, count: res.data?.data?.animeList?.length };
    } catch (e: any) {
        results.tests.ongoing = { error: e?.response?.status || e.message };
    }

    // Test 2: anime detail
    try {
        const res = await axios.get(`${ANIME_API_URL}/otakudesu/anime/kamuy-golden-season-5-sub-indo`, { timeout: 8000 });
        results.tests.animeDetail = { status: res.status, title: res.data?.data?.title };
    } catch (e: any) {
        results.tests.animeDetail = { error: e?.response?.status || e.message };
    }

    // Test 3: search
    try {
        const res = await axios.get(`${ANIME_API_URL}/otakudesu/search?q=naruto`, { timeout: 8000 });
        results.tests.search = { status: res.status, count: res.data?.data?.animeList?.length };
    } catch (e: any) {
        results.tests.search = { error: e?.response?.status || e.message };
    }

    return NextResponse.json(results, {
        headers: { "Cache-Control": "no-store" },
    });
}
