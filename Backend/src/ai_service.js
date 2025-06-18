
require('dotenv').config(); 

(async () => {
    try {
        const { default: fetch, Headers, Request, Response } = await import('node-fetch');

        if (!globalThis.fetch) globalThis.fetch = fetch;
        if (!globalThis.Headers) globalThis.Headers = Headers;
        if (!globalThis.Request) globalThis.Request = Request;
        if (!globalThis.Response) globalThis.Response = Response;

        console.log("node-fetch polyfill applied for older Node.js versions.");
    } catch (e) {
        console.warn("Could not load node-fetch polyfill. Ensure Node.js v18+ is used or node-fetch is installed correctly for older versions.", e);
    }
})();


const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Or "gemini-1.5-flash" for faster responses

async function generateContent(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while generating AI insights."; // Fallback message
    }
}



async function summarizeSalesSnapshot(data) {

    if (!data || data.length === 0) {
        return "No sales data available for summarization.";
    }
    const dataString = JSON.stringify(data, null, 2);
    const prompt = `As an AI-powered fashion buying assistant, summarize this weekly sales and profit data. Highlight top-performing categories by sales volume and gross profit margin. Point out any categories with unusually high return rates or low margins, suggesting immediate actionable steps for a fashion buyer. Focus on profitability and inventory health.

Data:\n${dataString}

Provide insights in bullet points, followed by actionable recommendations.`;
    return generateContent(prompt);
}

async function suggestUnderperformerActions(data) {
    // ... (your existing code for this function)
    if (!data || data.length === 0) {
        return "No underperforming products found to suggest actions for.";
    }
    const dataString = JSON.stringify(data, null, 2);
    const prompt = `As an AI-powered fashion buying assistant, analyze these underperforming products (high stock, low recent sales, potentially low profit). For each product, provide specific, actionable recommendations for a fashion buyer to mitigate losses or improve performance. Consider markdown strategies, promotional bundles, re-evaluation of future orders, or reallocation to different sales channels.

Data:\n${dataString}

Provide detailed recommendations for each product listed.`;
    return generateContent(prompt);
}

async function analyzeSupplierPerformance(data) {
    // ... (your existing code for this function)
    if (!data || data.length === 0) {
        return "No supplier performance data available for analysis.";
    }
    const dataString = JSON.stringify(data, null, 2);
    const prompt = `As an AI-powered fashion buying assistant, analyze this supplier performance data, focusing on sales contribution, gross profit margins, and return rates per supplier. Identify the top 3 most valuable suppliers and the top 3 most problematic suppliers. For problematic suppliers, suggest specific discussion points or strategies to address quality, lead times, or profitability issues.

Data:\n${dataString}

Provide insights and recommendations in a structured format.`;
    return generateContent(prompt);
}

async function analyzeTrend(keyword, productsData) {
    
    if (!productsData || productsData.length === 0) {
        return `No relevant product data found for the "${keyword}" trend to analyze.`;
    }
    const productsString = JSON.stringify(productsData.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        material: p.material
    })), null, 2); 

    const prompt = `A fashion buyer is exploring the trend "${keyword}". Based on the following product data, identify key characteristics of this trend (e.g., common materials, styles, aesthetics, color palettes). Suggest what types of new products or features a buyer should consider sourcing to capitalize on this trend, and highlight any current inventory that strongly aligns with this emerging trend.

Relevant Products:\n${productsString}

Provide insights in a concise, actionable format.`;
    return generateContent(prompt);
}

module.exports = {
    generateContent, 
    summarizeSalesSnapshot,
    suggestUnderperformerActions,
    analyzeSupplierPerformance,
    analyzeTrend
};