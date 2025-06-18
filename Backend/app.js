// backend/app.js

require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors'); // Import the CORS middleware
const mongoose = require('mongoose');

// Import your analytics and AI service functions
const {
    getSalesProfitSnapshot,
    getUnderperformingProducts,
    getSupplierPerformance,
    getProductsByTrendKeyword
} = require('./src/analytics'); // Assuming analytics.js is in src/
const {
    summarizeSalesSnapshot,
    suggestUnderperformerActions,
    analyzeSupplierPerformance,
    analyzeTrend
} = require('./src/ai_service'); // Assuming ai_service.js is in src/

const app = express();
const PORT = process.env.PORT || 3000; // Use port from .env or default to 3000
const MONGODB_URI = process.env.MONGODB_URI;

// --- Middleware ---
// Enable CORS for all routes, allowing your frontend to make requests
app.use(cors());
// Enable parsing of JSON request bodies (if you plan to send data from frontend to backend via POST/PUT)
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch(err => console.error('Could not connect to MongoDB Atlas:', err));

// --- API Endpoints ---

/**
 * GET /api/sales-snapshot
 * Fetches weekly sales and profit data and provides an AI summary.
 */
app.get('/api/sales-snapshot', async (req, res) => {
    try {
        console.log('--- Fetching Weekly Sales & Profit Snapshot ---');
        const salesData = await getSalesProfitSnapshot(); // Call your analytics function

        console.log('--- Generating AI Sales Summary & Recommendations ---');
        const aiSummary = await summarizeSalesSnapshot(salesData); // Call your AI service function

        // Send both raw data and AI summary in the response
        res.json({
            raw_data: salesData,
            ai_summary: aiSummary
        });
    } catch (error) {
        console.error('Error fetching sales snapshot:', error);
        // Send a 500 Internal Server Error response if something goes wrong
        res.status(500).json({ error: 'Failed to fetch sales snapshot', details: error.message });
    }
});

/**
 * GET /api/underperforming-products
 * Identifies underperforming products (high stock, low sales) and provides AI recommendations.
 */
app.get('/api/underperforming-products', async (req, res) => {
    try {
        console.log('--- Fetching Underperforming Products ---');
        const underperformers = await getUnderperformingProducts(); // Call your analytics function

        console.log('--- Generating AI Recommendations for Underperforming Products ---');
        const aiRecommendations = await suggestUnderperformerActions(underperformers); // Call your AI service function

        res.json({
            raw_data: underperformers,
            ai_recommendations: aiRecommendations
        });
    } catch (error) {
        console.error('Error fetching underperforming products:', error);
        res.status(500).json({ error: 'Failed to fetch underperforming products', details: error.message });
    }
});

/**
 * GET /api/supplier-performance
 * Analyzes supplier performance based on sales contribution, margins, and returns, with AI analysis.
 */
app.get('/api/supplier-performance', async (req, res) => {
    try {
        console.log('--- Fetching Supplier Performance ---');
        const supplierPerformance = await getSupplierPerformance(); // Call your analytics function

        console.log('--- Generating AI Analysis for Supplier Performance ---');
        const aiAnalysis = await analyzeSupplierPerformance(supplierPerformance); // Call your AI service function

        res.json({
            raw_data: supplierPerformance,
            ai_analysis: aiAnalysis
        });
    } catch (error) {
        console.error('Error fetching supplier performance:', error);
        res.status(500).json({ error: 'Failed to fetch supplier performance', details: error.message });
    }
});

/**
 * GET /api/trend-analysis?keyword=your_keyword
 * Analyzes products related to a specific keyword and provides AI trend insights.
 * Requires 'keyword' as a query parameter.
 */
app.get('/api/trend-analysis', async (req, res) => {
    const keyword = req.query.keyword; // Get the keyword from the URL query parameter

    if (!keyword) {
        // If no keyword is provided, send a 400 Bad Request error
        return res.status(400).json({ error: 'Keyword query parameter is required for trend analysis.' });
    }

    try {
        console.log(`--- Analyzing Trend: "${keyword}" ---`);
        const products = await getProductsByTrendKeyword(keyword); // Call your analytics function

        console.log(`--- Generating AI Trend Analysis & Sourcing Suggestions ---`);
        const aiTrendAnalysis = await analyzeTrend(keyword, products); // Call your AI service function

        res.json({
            keyword: keyword, // Echo the keyword back
            raw_data: products, // Raw matching products
            ai_trend_analysis: aiTrendAnalysis // AI insights
        });
    } catch (error) {
        console.error(`Error fetching trend analysis for "${keyword}":`, error);
        res.status(500).json({ error: 'Failed to fetch trend analysis', details: error.message });
    }
});


// --- Start the Express Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Backend ready for API requests.');
});

// --- Graceful Shutdown (Optional but Good Practice) ---
// Closes the MongoDB connection when the Node.js process receives a termination signal (e.g., Ctrl+C)
process.on('SIGINT', () => {
    mongoose.connection.close(() => {
        console.log('MongoDB connection disconnected through app termination');
        process.exit(0); // Exit the process
    });
});
