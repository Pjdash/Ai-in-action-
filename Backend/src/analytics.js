// src/analytics.js
const SaleOrder = require('../models/SaleOrder');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

async function getSalesProfitSnapshot() {
    // TEMPORARILY REMOVED DATE FILTER for troubleshooting.
    // This will attempt to aggregate ALL sales data regardless of date.
    // If this still returns no data, the problem is not with date range,
    // but with the data itself or the lookups/unwinds.

    try {
        return await SaleOrder.aggregate([
            // Removed the $match stage for order_date temporarily
            // {
            //     $match: {
            //         order_date: {
            //             $exists: true,
            //             $type: 'date',
            //             $gte: snapshotStartDate,
            //             $lte: snapshotEndDate
            //         }
            // }
            {
                $lookup: {
                    from: 'products', // Collection name for Product model (lowercase, plural)
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'productInfo'
                }
            },
            {
                // Ensure productInfo exists before unwinding
                $match: {
                    'productInfo': { $exists: true, $ne: [] }
                }
            },
            {
                $unwind: '$productInfo'
            },
            {
                $group: {
                    _id: '$productInfo.category',
                    total_sales_revenue: { $sum: '$price' },
                    total_cost_of_goods: { $sum: { $multiply: ['$quantity', '$productInfo.cost_price'] } },
                    total_items_sold: { $sum: '$quantity' },
                    total_returns: { $sum: { $cond: ['$return_status', '$quantity', 0] } },
                    total_return_revenue_lost: { $sum: { $cond: ['$return_status', '$price', 0] } }
                }
            },
            {
                $addFields: {
                    gross_profit: { $subtract: ['$total_sales_revenue', '$total_cost_of_goods'] },
                    return_rate_percentage: {
                        $cond: [
                            { $eq: ['$total_items_sold', 0] },
                            0,
                            { $multiply: [{ $divide: ['$total_returns', '$total_items_sold'] }, 100] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    gross_profit_margin_percentage: {
                        $cond: [
                            { $eq: ['$total_sales_revenue', 0] },
                            0,
                            { $multiply: [{ $divide: ['$gross_profit', '$total_sales_revenue'] }, 100] }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    total_sales: { $round: ["$total_sales_revenue", 2] },
                    total_profit: { $round: ["$gross_profit", 2] },
                    total_items_sold: 1,
                    total_returns: 1,
                    return_rate_percentage: { $round: ["$return_rate_percentage", 2] },
                    gross_profit_margin_percentage: { $round: ["$gross_profit_margin_percentage", 2] }
                }
            },
            {
                $sort: { total_sales: -1 }
            }
        ]);
    } catch (error) {
        console.error("Error in getSalesProfitSnapshot:", error);
        throw error;
    }
}

async function getUnderperformingProducts() {
    // Current date range and filters are kept as they are now working based on your report.
    const salesDataStartDate = new Date('2019-01-01T00:00:00Z'); // Start of 2019 for sales data lookup
    const salesDataEndDate = new Date('2019-12-31T23:59:59Z'); // End of 2019 for sales data lookup
    const referenceDateForDaysAgo = new Date('2019-12-31T23:59:59Z');

    try {
        return await Product.aggregate([
            {
                $lookup: {
                    from: 'saleorders',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'salesData'
                }
            },
            {
                $addFields: {
                    sales_last_90_days: {
                        $sum: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$salesData",
                                        as: "sale",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$sale.order_date", salesDataStartDate] },
                                                { $lte: ["$$sale.order_date", salesDataEndDate] }
                                            ]
                                        }
                                    }
                                },
                                as: "filteredSale",
                                in: "$$filteredSale.quantity"
                            }
                        }
                    },
                    last_sale_date: { $max: "$salesData.order_date" }
                }
            },
            {
                $project: {
                    _id: 0,
                    product_id: 1,
                    name: 1,
                    category: 1,
                    current_stock: 1,
                    last_sale_date: 1,
                    sales_last_90_days: 1,
                    last_sold_days_ago: {
                        $cond: {
                            if: { $ne: ["$last_sale_date", null] },
                            then: { $floor: { $divide: [{ $subtract: [referenceDateForDaysAgo, "$last_sale_date"] }, 1000 * 60 * 60 * 24] } },
                            else: "N/A"
                        }
                    },
                    potential_loss_value: { $multiply: ['$current_stock', '$cost_price'] }
                }
            },
            {
                $match: {
                    current_stock: { $gt: 0 },
                    sales_last_90_days: { $lt: 50 }
                }
            },
            {
                $sort: { potential_loss_value: -1 }
            },
            {
                $limit: 10
            }
        ]);
    } catch (error) {
        console.error("Error in getUnderperformingProducts:", error);
        throw error;
    }
}

async function getSupplierPerformance() {
    try {
        return await SaleOrder.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: 'product_id',
                    as: 'productInfo'
                }
            },
            {
                $unwind: '$productInfo'
            },
            {
                $lookup: {
                    from: 'suppliers', // Collection name for Supplier model
                    localField: 'productInfo.supplier_id',
                    foreignField: 'supplier_id',
                    as: 'supplierInfo'
                }
            },
            {
                $unwind: '$supplierInfo'
            },
            {
                $group: {
                    _id: '$supplierInfo.supplier_id',
                    supplier_name: { $first: '$supplierInfo.name' },
                    total_sales_revenue: { $sum: '$price' },
                    total_cost_of_goods: { $sum: { $multiply: ['$quantity', '$productInfo.cost_price'] } },
                    total_items_sold: { $sum: '$quantity' },
                    total_returns: { $sum: { $cond: ['$return_status', '$quantity', 0] } },
                    average_quality_rating: { $avg: '$supplierInfo.quality_rating' }
                }
            },
            {
                $addFields: {
                    gross_profit: { $subtract: ['$total_sales_revenue', '$total_cost_of_goods'] },
                    return_rate_percentage: {
                        $cond: [
                            { $eq: ['$total_items_sold', 0] },
                            0,
                            { $multiply: [{ $divide: ['$total_returns', '$total_items_sold'] }, 100] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    gross_profit_margin_percentage: {
                        $cond: [
                            { $eq: ['$total_sales_revenue', 0] },
                            0,
                            { $multiply: [{ $divide: ['$gross_profit', '$total_sales_revenue'] }, 100] }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    supplier_id: "$_id", // Matches frontend
                    supplier_name: 1, // Matches frontend
                    total_sales: { $round: ["$total_sales_revenue", 2] }, // Renamed and rounded for frontend
                    total_profit: { $round: ["$gross_profit", 2] }, // Added for completeness, might be useful
                    avg_profit_margin: { $round: ["$gross_profit_margin_percentage", 2] }, // Renamed and rounded for frontend
                    avg_return_rate: { $round: ["$return_rate_percentage", 2] }, // Renamed and rounded for frontend
                    total_items_sold: 1, // Added for completeness
                    total_returns: 1, // Added for completeness
                    average_quality_rating: { $round: ["$average_quality_rating", 2] } // Added for completeness
                }
            },
            {
                $sort: { total_sales: -1 } // Sort by highest sales per supplier
            }
        ]);
    } catch (error) {
        console.error("Error in getSupplierPerformance:", error);
        throw error;
    }
}

async function getProductsByTrendKeyword(keyword) {
    // This uses a simple regex search. For a real system, you'd use Atlas Search
    // with text indexes for better performance and relevance ranking.
    try {
        return await Product.find({
            $or: [
                { name: { $regex: new RegExp(keyword, 'i') } },
                { description: { $regex: new RegExp(keyword, 'i') } },
                { category: { $regex: new RegExp(keyword, 'i') } },
                { material: { $regex: new RegExp(keyword, 'i') } }
            ]
        }).limit(20); // Limit results for AI processing to avoid sending too much data to Gemini
    } catch (error) {
        console.error("Error in getProductsByTrendKeyword:", error);
        throw error;
    }
}

module.exports = {
    getSalesProfitSnapshot,
    getUnderperformingProducts,
    getSupplierPerformance,
    getProductsByTrendKeyword
};
