import { useState, useEffect } from 'react';
import './App.css'; // Import component-specific styles

function App() {
    const BACKEND_URL = 'http://localhost:3000'; // IMPORTANT: Make sure this matches your backend's PORT

    // State variables to hold data for each section
    const [salesData, setSalesData] = useState(null);
    const [salesAiSummary, setSalesAiSummary] = useState("No AI summary yet.");

    const [underperformersData, setUnderperformersData] = useState(null);
    const [underperformersAiRecommendations, setUnderperformersAiRecommendations] = useState("No AI recommendations yet.");

    const [supplierData, setSupplierData] = useState(null);
    const [supplierAiAnalysis, setSupplierAiAnalysis] = useState("No AI analysis yet.");

    const [trendKeyword, setTrendKeyword] = useState('');
    const [trendRawData, setTrendRawData] = useState(null);
    const [trendAiInsights, setTrendAiInsights] = useState("No AI trend insights yet.");

    // Helper function to fetch data
    const fetchData = async (endpoint) => {
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
            // Provide more informative error messages to the user
            let userMessage = 'Failed to fetch data. Ensure the backend server is running and accessible.';
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                userMessage = 'Network error: Could not connect to the backend. Is the backend server running?';
            } else if (error.message.includes('404')) {
                userMessage = 'Endpoint not found. Check the backend route.';
            } else if (error.message.includes('500')) {
                userMessage = 'Server error. Something went wrong on the backend.';
            }
            throw new Error(userMessage + ` (Details: ${error.message})`); // Re-throw to be caught by specific handlers
        }
    };

    // --- Fetch Functions for Each Section ---

    const fetchSalesSnapshot = async () => {
        setSalesData('Loading raw data...');
        setSalesAiSummary('Loading AI insights...');
        try {
            const data = await fetchData('/api/sales-snapshot');
            setSalesData(data.raw_data);
            setSalesAiSummary(data.ai_summary);
        } catch (error) {
            setSalesData(`Error: ${error.message}`);
            setSalesAiSummary(`Error generating AI insights: ${error.message}`);
        }
    };

    const fetchUnderperformingProducts = async () => {
        setUnderperformersData('Loading raw data...');
        setUnderperformersAiRecommendations('Loading AI recommendations...');
        try {
            const data = await fetchData('/api/underperforming-products');
            setUnderperformersData(data.raw_data);
            setUnderperformersAiRecommendations(data.ai_recommendations);
        } catch (error) {
            setUnderperformersData(`Error: ${error.message}`);
            setUnderperformersAiRecommendations(`Error generating AI insights: ${error.message}`);
        }
    };

    const fetchSupplierPerformance = async () => {
        setSupplierData('Loading raw data...');
        setSupplierAiAnalysis('Loading AI analysis...');
        try {
            const data = await fetchData('/api/supplier-performance');
            setSupplierData(data.raw_data);
            setSupplierAiAnalysis(data.ai_analysis);
        } catch (error) {
            setSupplierData(`Error: ${error.message}`);
            setSupplierAiAnalysis(`Error generating AI insights: ${error.message}`);
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

            // Special handling if raw_data is an array of strings (like product names)
            if (data.raw_data && Array.isArray(data.raw_data) && typeof data.raw_data[0] === 'string') {
                setTrendRawData(data.raw_data.join('\n')); // Join array elements with newlines for display
            } else {
                setTrendRawData(data.raw_data); // Otherwise, display as-is (objects, numbers, etc.)
            }
            setTrendAiInsights(data.ai_trend_analysis);
        } catch (error) {
            setTrendRawData(`Error: ${error.message}`);
            setTrendAiInsights(`Error generating AI insights: ${error.message}`);
        }
    };

    // Effect to add a 'loaded' class for initial fade-in (if you add CSS for it)
    useEffect(() => {
        // You can add a class to the root element if you want an initial fade-in effect
        // document.getElementById('root').classList.add('loaded');
    }, []);

    return (
        <>
            <header>
                <h1>RetailEdge AI Insights Dashboard</h1>
                <p>Leveraging AI for smarter fashion retail decisions.</p>
            </header>

            <main>
                <section className="card">
                    <h2>Weekly Sales & Profit Snapshot</h2>
                    <button onClick={fetchSalesSnapshot}>Get Insights</button>
                    <div className="content-area">
                        <h3>Raw Data:</h3>
                        <pre>{salesData ? JSON.stringify(salesData, null, 2) : 'Click "Get Insights"'}</pre>
                        <h3>AI Summary:</h3>
                        <pre>{salesAiSummary}</pre>
                    </div>
                </section>

                <section className="card">
                    <h2>Underperforming Products</h2>
                    <button onClick={fetchUnderperformingProducts}>Get Insights</button>
                    <div className="content-area">
                        <h3>Raw Data:</h3>
                        <pre>{underperformersData ? JSON.stringify(underperformersData, null, 2) : 'Click "Get Insights"'}</pre>
                        <h3>AI Recommendations:</h3>
                        <pre>{underperformersAiRecommendations}</pre>
                    </div>
                </section>

                <section className="card">
                    <h2>Supplier Performance</h2>
                    <button onClick={fetchSupplierPerformance}>Get Insights</button>
                    <div className="content-area">
                        <h3>Raw Data:</h3>
                        <pre>{supplierData ? JSON.stringify(supplierData, null, 2) : 'Click "Get Insights"'}</pre>
                        <h3>AI Analysis:</h3>
                        <pre>{supplierAiAnalysis}</pre>
                    </div>
                </section>

                <section className="card">
                    <h2>Trend Analysis</h2>
                    <div className="trend-input">
                        <input
                            type="text"
                            id="trendKeyword"
                            placeholder="e.g., 'denim', 'boho chic'"
                            value={trendKeyword}
                            onChange={(e) => setTrendKeyword(e.target.value)}
                        />
                        <button onClick={fetchTrendAnalysis}>Analyze Trend</button>
                    </div>
                    <div className="content-area">
                        <h3>Raw Products:</h3>
                        <pre>{trendRawData ? (typeof trendRawData === 'string' ? trendRawData : JSON.stringify(trendRawData, null, 2)) : 'Enter keyword & click "Analyze Trend"'}</pre>
                        <h3>AI Trend Insights:</h3>
                        <pre>{trendAiInsights}</pre>
                    </div>
                </section>
            </main>

            <footer>
                <p>&copy; 2024 RetailEdge AI. Powered by Gemini.</p>
            </footer>
        </>
    );
}

export default App;