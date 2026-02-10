import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // In a real scenario with RapidAPI, you'd send this buffer.
        // For now, if no API key is set, we can simulate or return an error.

        const rapidApiKey = process.env.RAPIDAPI_KEY;

        if (!rapidApiKey) {
            // Mock response for testing without key
            console.log("No API key found, returning mock response");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

            return NextResponse.json({
                result: {
                    title: "Mock Song Title",
                    artist: "Mock Artist",
                    album: "Mock Album",
                    coverArt: "https://placehold.co/400x400/png",
                    youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                }
            });
        }

        // RapidAPI Shazam request
        console.log("Buffer size:", buffer.length);
        console.log("API Key present:", !!rapidApiKey);

        // Shazam V2 expects raw binary data in the body for some endpoints, 
        // or multipart/form-data with specific field names.
        // Let's try sending as raw body if multipart fails, but for now stick to multipart with correct type.
        // Some docs suggest 'audio/webm' might need conversion to PCM/RAW.

        // Detect URL
        const url = 'https://shazam-core.p.rapidapi.com/v1/charts/track';
        // Wait, core API has different endpoints. 
        // Let's stick to the KEY being valid for the 'Shazam Core' API on RapidAPI?
        // Actually, the key e236906... is generic for RapidAPI, BUT it only works for subscribed APIs.

        // Let's try switching to the 'Shazam Core' host (shazam-core.p.rapidapi.com)
        // Its detect endpoint is usually at /v1/tracks/recognize-audio-file or similar?
        // Checking RapidAPI: Shazam Core has separate endpoints.

        // REVERT: If 302, it means the key is NOT for shazam.p.rapidapi.com.
        // Let's assume the user clicked the first link and subscribed to 'Shazam Core' which is popular.

        // Actually, let's keep the endpoint as V2 but change the HOST header? 
        // NO, the host must match the endpoint domain.

        // Let's try the other popular one: generic 'shazam' hosted by 'apidojo'.
        // Host: 'shazam.p.rapidapi.com' -> This redirecting implies not subscribed.

        // Let's try 'shazam-core.p.rapidapi.com' with ITS detection endpoint.
        // Docs say: https://shazam-core.p.rapidapi.com/v1/charts/world 
        // Wait, Shazam Core doesn't have a public free detect endpoint as easily accessible sometimes?

        // Let's stick to 'shazam.p.rapidapi.com' but maybe the endpoint is wrong?
        // V2 detect is correct.

        // Okay, let's try 'shazam-api6.p.rapidapi.com' (another clone).
        // OR 'shazam8.p.rapidapi.com'.

        // Actually, I will try to use the `shazam-core` host with the `/v1/detect` if it exists, or similar.
        // But safe bet: The user key might be for a different API entirely.

        // Let's try changing the host to 'shazam-core.p.rapidapi.com' and see if the connectivity check passes (using search or chart endpoint).
        // Connectivity check uses /search. Shazam Core supports /v1/search/multi?query=...

        // Detect URL
        const detectUrl = 'https://shazam.p.rapidapi.com/songs/v2/detect';

        // Revert to FormData (or raw base64 if needed, but FormData is cleaner for files)
        // Since we are sending a WAV file now, FormData with standard upload should work fine.
        // But remember the debug script used raw base64. Let's stick to what worked: RAW BASE64.

        // Actually, the previous route.js was already updated to use raw Base64.
        // We just need to make sure the Frontend sends a 'file' that we can read.

        // The frontend sends formData with 'file'.
        // We read it into a buffer.

        // Ensure the buffer is sent as base64 string.
        console.log("Processing detection request...");

        // Simplified detection logic mimicking successful debug script
        const response = await fetch(detectUrl + '?timezone=America%2FChicago&locale=en-US', {
            method: 'POST',
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': 'shazam.p.rapidapi.com',
                'Content-Type': 'text/plain'
            },
            body: buffer.toString('base64')
        });

        const responseText = await response.text();
        console.log("RapidAPI Status:", response.status);

        if (!response.ok) {
            console.error("RapidAPI Error Body:", responseText);
            throw new Error(`RapidAPI responded with ${response.status}`);
        }

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse JSON:", e);
            throw new Error("Invalid JSON from Shazam API");
        }

        const track = result.track;

        if (!track) {
            console.warn("No match found data:", result);
            return NextResponse.json({ error: "No match found" }, { status: 404 });
        }

        const output = {
            title: track.title,
            artist: track.subtitle,
            coverArt: track.images?.coverart || track.images?.background,
            shazamLink: track.url,
            appleMusicUrl: track.hub?.actions?.find(a => a.type === 'uri')?.uri,
            hub: track.hub,
            youtubeLink: track.sections?.find(s => s.type === 'VIDEO')?.youtubeurl?.actions?.[0]?.uri || `https://www.youtube.com/results?search_query=${encodeURIComponent(track.title + " " + track.subtitle)}`
        };

        return NextResponse.json({ result: output });

    } catch (error) {
        console.error("Detection error:", error);
        return NextResponse.json({
            error: "Detection failed",
            details: error.message
        }, { status: 500 });
    }
}
