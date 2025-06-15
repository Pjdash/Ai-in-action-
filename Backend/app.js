require('dotenv').config();
const mongoose = require('mongoose');
const { getSalesProfitSnapshot, getUnderperformingProducts, getSupplierPerformance, getProductsByTrendKeyword } = require('./src/analytics');
const { summarizeSalesSnapshot, suggestUnderperformerActions, analyzeSupplierPerformance, analyzeTrend } = require('./src/ai_service');

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB Atlas!');

    const args = process.argv; // Get all arguments

    if (args.includes('--sales')) {
      console.log('--- Fetching Weekly Sales & Profit Snapshot ---');
      const data = await getSalesProfitSnapshot();
      console.log('\n--- Raw Sales Data (Last 7 Days) ---');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n--- AI Sales Summary & Recommendations ---');
      const aiSummary = await summarizeSalesSnapshot(data);
      console.log(aiSummary);
    }

    if (args.includes('--underperformers')) {
      console.log('--- Fetching Underperforming Products ---');
      const data = await getUnderperformingProducts();
      console.log('\n--- Raw Underperforming Products Data ---');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n--- AI Recommendations for Underperforming Products ---');
      const aiRecs = await suggestUnderperformerActions(data);
      console.log(aiRecs);
    }

    if (args.includes('--suppliers')) {
      console.log('--- Fetching Supplier Performance ---');
      const data = await getSupplierPerformance();
      console.log('\n--- Raw Supplier Performance Data ---');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n--- AI Supplier Analysis & Strategies ---');
      const aiAnalysis = await analyzeSupplierPerformance(data);
      console.log(aiAnalysis);
    }

    const trendIndex = args.indexOf('--trend');
    if (trendIndex > -1 && args[trendIndex + 1]) {
        const trendKeyword = args[trendIndex + 1];
        console.log(`--- Analyzing Trend: "${trendKeyword}" ---`);
        const productsData = await getProductsByTrendKeyword(trendKeyword);
        console.log(`\n--- Raw Products Matching "${trendKeyword}" ---`);
        console.log(JSON.stringify(productsData.map(p => p.name), null, 2)); // Just show names for brevity
        console.log('\n--- AI Trend Analysis & Sourcing Suggestions ---');
        const aiTrendAnalysis = await analyzeTrend(trendKeyword, productsData);
        console.log(aiTrendAnalysis);
    }

    if (args.length <= 2) { // Only node and app.js are present, or no specific command
      console.log('Usage:');
      console.log('  node app.js --sales             (Get weekly sales & profit snapshot with AI insights)');
      console.log('  node app.js --underperformers   (Get underperforming products with AI recommendations)');
      console.log('  node app.js --suppliers         (Get supplier performance with AI analysis)');
      console.log('  node app.js --trend "your-keyword" (Analyze a specific trend with AI suggestions)');
      console.log('\nExample: node app.js --sales --trend "boho chic"');
    }

  } catch (error) {
    console.error('Application error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas.');
  }
}

main().catch(console.error);