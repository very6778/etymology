import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Helper to generate random hex string (mimicking nisanyan_parser logic)
function genHexString(len: number) {
    const hex = "0123456789ABCDEF";
    let output = "";
    for (let i = 0; i < len; ++i) {
        output += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return output;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const word = searchParams.get("word");

    if (!word) {
        return NextResponse.json({ error: "Word parameter is required" }, { status: 400 });
    }

    try {
        const encodedWord = encodeURIComponent(word);
        const sessionID = genHexString(12);

        // Using the endpoint discovered from nisanyan_parser package
        const url = `https://www.nisanyansozluk.com/api/words/${encodedWord}?session=${sessionID}`;

        console.log(`Fetching Nişanyan data for: ${word}`);

        const response = await axios.get(url);

        if (!response.data || !response.data.words || response.data.words.length === 0) {
            return NextResponse.json({ error: "Word not found" }, { status: 404 });
        }

        return NextResponse.json(response.data);

    } catch (error: any) {
        console.error("Nişanyan API Error:", error.message);
        return NextResponse.json(
            { error: "Failed to fetch data from Nişanyan Sözlük" },
            { status: 500 }
        );
    }
}
