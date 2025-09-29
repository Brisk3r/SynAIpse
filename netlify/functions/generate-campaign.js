const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // Get the Gemini API Key from Netlify's environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured.' }) };
    }

    try {
        const { seedContent } = JSON.parse(event.body);

        if (!seedContent) {
            return { statusCode: 400, body: JSON.stringify({ error: 'seedContent is required.' }) };
        }

        const prompt = `
            You are an expert social media manager. Based on the following content, generate a social media campaign consisting of 3 distinct posts for different platforms.
            The content is: "${seedContent}"

            For each post, provide:
            1. A suitable platform (e.g., X, LinkedIn, Instagram).
            2. A compelling and platform-appropriate caption.
            3. A short, descriptive idea for a visual (e.g., "A graphic showing the main statistic", "A photo of the team").

            Return the response as a valid JSON array of objects. Each object should have the keys "platform", "caption", and "visual_idea". Do not include markdown ticks or the word "json" in your response.
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Gemini API Error:', errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: `Gemini API failed: ${errorBody}` }) };
        }

        const result = await response.json();
        const rawText = result.candidates[0].content.parts[0].text;
        const generatedPosts = JSON.parse(rawText);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generatedPosts)
        };

    } catch (error) {
        console.error('Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
    }
};
