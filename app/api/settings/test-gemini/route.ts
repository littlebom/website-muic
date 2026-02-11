import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { apiKey } = await request.json();

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: "API Key is required" },
                { status: 400 }
            );
        }

        const MODEL = "gemini-2.0-flash";
        const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;

        // Try a simple generation to validate the key
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: "Hello, are you active?" }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 10,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini Test Error:", errorText);
            let errorMsg = "Connection failed";
            try {
                const errJson = JSON.parse(errorText);
                errorMsg = errJson.error?.message || errorMsg;
            } catch (e) { /* ignore */ }

            return NextResponse.json(
                { success: false, error: errorMsg },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ success: true, data }); // Send back data just in case

    } catch (error: any) {
        console.error("Test Gemini API Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
