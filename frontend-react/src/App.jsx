import React, { useState, useEffect } from 'react';
import './App.css';

// --- Custom Hook: useTypingEffect ---
const useTypingEffect = (text, speed = 25) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!text) {
            setDisplayedText('');
            setCurrentIndex(0);
            return;
        }

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text.charAt(currentIndex));
                setCurrentIndex((prev) => prev + 1);
            }, speed);
            return () => clearTimeout(timeout);
        }
    }, [text, currentIndex, speed]);

    // Reset when text prop changes
    useEffect(() => {
        setDisplayedText('');
        setCurrentIndex(0);
    }, [text]);

    return displayedText;
};

const BACKEND_URL = 'http://localhost:3000'; // IMPORTANT: Match your backend's PORT

function App() {
    // State for Sales & Profit Snapshot
    const [salesRawData, setSalesRawData] = useState(null);
    const [salesAiSummary, setSalesAiSummary] = useState("Click 'Get Insights' for a weekly sales and profit summary.");
    const typedSalesAiSummary = useTypingEffect(salesAiSummary);

    // State for Underperforming Products
    const [underperformersRawData, setUnderperformersRawData] = useState(null);
    const [underperformersAiRecommendations, setUnderperformersAiRecommendations] = useState("Click 'Get Insights' for recommendations on underperforming products.");
    const typedUnderperformersAiRecommendations = useTypingEffect(underperformersAiRecommendations);

    // State for Supplier Performance
    const [supplierRawData, setSupplierRawData] = useState(null);
    const [supplierAiAnalysis, setSupplierAiAnalysis] = useState("Click 'Get Insights' for supplier performance analysis.");
    const typedSupplierAiAnalysis = useTypingEffect(supplierAiAnalysis);

    // State for Trend Analysis
    const [trendKeyword, setTrendKeyword] = useState('');
    const [trendAiInsights, setTrendAiInsights] = useState("Enter a keyword and click 'Analyze Trend' for trend insights.");
    const typedTrendAiInsights = useTypingEffect(trendAiInsights);
    const [trendRawData, setTrendRawData] = useState(null); // Keep this to display raw trend data


    // --- Helper function to fetch data ---
    async function fetchData(endpoint) { // Simplified to only GET method
        try {
            const response = await fetch(`${BACKEND_URL}${endpoint}`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            let userMessage = 'Failed to fetch data. Ensure the backend server is running and accessible.';
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                userMessage = 'Network error: Could not connect to the backend. Is the backend server running?';
            } else if (error.message.includes('404')) {
                userMessage = 'Endpoint not found. Check the backend route.';
            } else if (error.message.includes('500')) {
                userMessage = 'Server error. Something went wrong on the backend.';
            }
            throw new Error(userMessage + ` (Details: ${error.message})`);
        }
    }


    // --- Fetch Functions ---

    const fetchSalesSnapshot = async () => {
        setSalesRawData('Loading raw data...');
        setSalesAiSummary('Loading AI insights...');
        try {
            const data = await fetchData('/api/sales-snapshot');
            setSalesRawData(data.raw_data);
            setSalesAiSummary(data.ai_summary);
        } catch (error) {
            setSalesRawData(`Error: ${error.message}`);
            setSalesAiSummary(`Error: ${error.message}`);
        }
    };

    const fetchUnderperformingProducts = async () => {
        setUnderperformersRawData('Loading raw data...');
        setUnderperformersAiRecommendations('Loading AI recommendations...');
        try {
            const data = await fetchData('/api/underperforming-products');
            setUnderperformersRawData(data.raw_data);
            setUnderperformersAiRecommendations(data.ai_recommendations);
        } catch (error) {
            setUnderperformersRawData(`Error: ${error.message}`);
            setUnderperformersAiRecommendations(`Error: ${error.message}`);
        }
    };

    const fetchSupplierPerformance = async () => {
        setSupplierRawData('Loading raw data...');
        setSupplierAiAnalysis('Loading AI analysis...');
        try {
            const data = await fetchData('/api/supplier-performance');
            setSupplierRawData(data.raw_data);
            setSupplierAiAnalysis(data.ai_analysis);
        } catch (error) {
            setSupplierRawData(`Error: ${error.message}`);
            setSupplierAiAnalysis(`Error: ${error.message}`);
        }
    };

    const fetchTrendAnalysis = async () => {
        if (!trendKeyword.trim()) {
            alert('Please enter a keyword for trend analysis.');
            return;
        }
        setTrendRawData('Loading raw data...');
        setTrendAiInsights('Loading AI insights...');
        try {
            const encodedKeyword = encodeURIComponent(trendKeyword);
            const data = await fetchData(`/api/trend-analysis?keyword=${encodedKeyword}`);
            setTrendRawData(data.raw_data);
            setTrendAiInsights(data.ai_trend_analysis);
        } catch (error) {
            setTrendRawData(`Error: ${error.message}`);
            setTrendAiInsights(`Error: ${error.message}`);
        }
    };


    // --- Raw Data Renderers (Ensuring only fetched data is displayed clearly) ---

    const renderSalesRawData = (data) => {
        if (!data) return 'Click "Get Insights" to load sales data.';
        if (typeof data === 'string') return data; // Display error message directly

        if (data.length === 0) return 'No sales data available for the selected period.';

        return (
            <ul className="data-list">
                {data.map((item, index) => (
                    <li key={index} className="data-item">
                        {item.category && <><strong>Category:</strong> {item.category}<br /></>}
                        {(item.total_sales !== undefined && item.total_sales !== null) && <><strong>Total Sales:</strong> ${item.total_sales.toFixed(2)}<br /></>}
                        {(item.total_profit !== undefined && item.total_profit !== null) && <><strong>Total Profit:</strong> ${item.total_profit.toFixed(2)}<br /></>}
                        {(item.total_items_sold !== undefined && item.total_items_sold !== null) && <><strong>Total Items Sold:</strong> {item.total_items_sold}<br /></>}
                        {(item.total_returns !== undefined && item.total_returns !== null) && <><strong>Total Returns:</strong> {item.total_returns}<br /></>}
                        {(item.return_rate_percentage !== undefined && item.return_rate_percentage !== null) && <><strong>Return Rate:</strong> {item.return_rate_percentage.toFixed(2)}%<br /></>}
                        {(item.gross_profit_margin_percentage !== undefined && item.gross_profit_margin_percentage !== null) && <><strong>Gross Profit Margin:</strong> {item.gross_profit_margin_percentage.toFixed(2)}%<br /></>}
                    </li>
                ))}
            </ul>
        );
    };

    const renderUnderperformersRawData = (data) => {
        if (!data) return 'Click "Get Insights" to load underperforming products data.';
        if (typeof data === 'string') return data; // Display error message directly

        if (data.length === 0) return 'No underperforming products found.';

        return (
            <ul className="data-list">
                {data.map((product, index) => (
                    <li key={index} className="data-item">
                        {product.name && <><strong>Product Name:</strong> {product.name}<br /></>}
                        {(product.current_stock !== undefined && product.current_stock !== null) && <><strong>Stock:</strong> {product.current_stock}<br /></>}
                        {(product.last_sold_days_ago !== undefined && product.last_sold_days_ago !== null) && <><strong>Last Sold (Days Ago):</strong> {product.last_sold_days_ago}<br /></>}
                        {(product.sales_last_90_days !== undefined && product.sales_last_90_days !== null) && <><strong>Sales (Last 90 Days):</strong> {product.sales_last_90_days}<br /></>}
                        {product.category && <><strong>Category:</strong> {product.category}<br /></>}
                        {product.product_id && <><strong>Product ID:</strong> {product.product_id}<br /></>}
                        {product.last_sale_date && <><strong>Last Sale Date:</strong> {new Date(product.last_sale_date).toLocaleDateString()}<br /></>}
                        {(product.potential_loss_value !== undefined && product.potential_loss_value !== null) && <><strong>Potential Loss Value:</strong> ${product.potential_loss_value.toFixed(2)}<br /></>}
                    </li>
                ))}
            </ul>
        );
    };

    const renderSupplierRawData = (data) => {
        if (!data) return 'Click "Get Insights" to load supplier performance data.';
        if (typeof data === 'string') return data; // Display error message directly

        if (data.length === 0) return 'No supplier performance data found.';

        return (
            <ul className="data-list">
                {data.map((supplier, index) => (
                    <li key={index} className="data-item">
                        {supplier.supplier_id && <><strong>Supplier ID:</strong> {supplier.supplier_id}<br /></>}
                        {supplier.supplier_name && <><strong>Supplier Name:</strong> {supplier.supplier_name}<br /></>}
                        {(supplier.total_sales !== undefined && supplier.total_sales !== null) && <><strong>Total Sales:</strong> ${supplier.total_sales.toFixed(2)}<br /></>}
                        {(supplier.total_profit !== undefined && supplier.total_profit !== null) && <><strong>Total Profit:</strong> ${supplier.total_profit.toFixed(2)}<br /></>}
                        {(supplier.avg_profit_margin !== undefined && supplier.avg_profit_margin !== null) && <><strong>Avg. Profit Margin:</strong> {supplier.avg_profit_margin.toFixed(2)}%<br /></>}
                        {(supplier.avg_return_rate !== undefined && supplier.avg_return_rate !== null) && <><strong>Avg. Return Rate:</strong> {supplier.avg_return_rate.toFixed(2)}%<br /></>}
                        {(supplier.total_items_sold !== undefined && supplier.total_items_sold !== null) && <><strong>Total Items Sold:</strong> {supplier.total_items_sold}<br /></>}
                        {(supplier.total_returns !== undefined && supplier.total_returns !== null) && <><strong>Total Returns:</strong> {supplier.total_returns}<br /></>}
                        {(supplier.average_quality_rating !== undefined && supplier.average_quality_rating !== null) && <><strong>Average Quality Rating:</strong> {supplier.average_quality_rating.toFixed(2)}<br /></>}
                    </li>
                ))}
            </ul>
        );
    };

    const renderTrendRawData = (data, keyword) => {
        if (!data) return 'Enter keyword & click "Analyze Trend" to load product data.';
        if (typeof data === 'string') return data; // Display error message directly

        if (data.length === 0) return `No products found matching "${keyword}".`;

        // If data is an array of strings (e.g., just product names from earlier simplified output)
        if (Array.isArray(data) && typeof data[0] === 'string') {
            return (
                <ul className="data-list">
                    {data.map((item, index) => (
                        <li key={index} className="data-item"><strong>Product:</strong> {item}</li>
                    ))}
                </ul>
            );
        }
        // If data is an array of product objects
        return (
            <ul className="data-list">
                {data.map((product, index) => (
                    <li key={index} className="data-item">
                        {product.name && <><strong>Name:</strong> {product.name}<br /></>}
                        {product.category && <><strong>Category:</strong> {product.category}<br /></>}
                        {product.material && <><strong>Material:</strong> {product.material}<br /></>}
                        {product.description && <><strong>Description:</strong> {product.description.substring(0, 100) + '...'}<br /></>}
                        {product.product_id && <><strong>Product ID:</strong> {product.product_id}<br /></>}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <>
            <header>
                <h1>TrendEdge</h1> {/* Changed title */}
                <p>Leveraging AI for smarter fashion retail decisions.</p>
            </header>

            <main>
                <section className="card sales-card">
                    <h2 className="card-title">Weekly Sales & Profit Snapshot</h2>
                    <div className="card-actions">
                        <button onClick={fetchSalesSnapshot}>Get Insights</button>
                    </div>
                    <div className="raw-data-display">
                        <h3>Raw Data:</h3>
                        {renderSalesRawData(salesRawData)}
                    </div>
                    <div className="ai-insights">
                        <h3>AI Summary:</h3>
                        <pre>{typedSalesAiSummary}</pre>
                    </div>
                </section>

                <section className="card underperformers-card">
                    <h2 className="card-title">Underperforming Products</h2>
                     <div className="card-actions">
                        <button onClick={fetchUnderperformingProducts}>Get Insights</button>
                    </div>
                    <div className="raw-data-display">
                        <h3>Raw Data:</h3>
                        {renderUnderperformersRawData(underperformersRawData)}
                    </div>
                    <div className="ai-insights">
                        <h3>AI Recommendations:</h3>
                        <pre>{typedUnderperformersAiRecommendations}</pre>
                    </div>
                </section>

                <section className="card supplier-card">
                    <h2 className="card-title">Supplier Performance</h2>
                     <div className="card-actions">
                        <button onClick={fetchSupplierPerformance}>Get Insights</button>
                    </div>
                    <div className="raw-data-display">
                        <h3>Raw Data:</h3>
                        {renderSupplierRawData(supplierRawData)}
                    </div>
                    <div className="ai-insights">
                        <h3>AI Analysis:</h3>
                        <pre>{typedSupplierAiAnalysis}</pre>
                    </div>
                </section>

                <section className="card trend-card">
                    <h2 className="card-title">Trend Analysis</h2>
                    <div className="trend-input">
                        <input
                            type="text"
                            id="trendKeyword"
                            placeholder="e.g., 't-shirt', 'denim', 'boho chic'" // Updated placeholder
                            value={trendKeyword}
                            onChange={(e) => setTrendKeyword(e.target.value)}
                        />
                        <button onClick={fetchTrendAnalysis}>Analyze Trend</button>
                    </div>
                     <div className="raw-data-display">
                        <h3>Raw Data:</h3>
                        {renderTrendRawData(trendRawData, trendKeyword)}
                    </div>
                    <div className="ai-insights">
                        <h3>AI Trend Insights:</h3>
                        <pre>{typedTrendAiInsights}</pre>
                    </div>
                </section>
            </main>

            <footer>
                <p>&copy; 2024 TrendEdge.</p> {/* Removed "Powered by Gemini" */}
            </footer>
        </>
    );
}

export default App;
