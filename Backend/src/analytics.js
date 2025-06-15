// src/analytics.js
const SaleOrder = require('./models/SaleOrder');
const Product = require('./models/Product');
const Supplier = require('./models/Supplier');
const mongoose = require('mongoose'); // Ensure mongoose is imported here too for types

async function getSalesProfitSnapshot() {
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));

    // Aggregate sales data for the last 7 days, grouped by product category
    return await SaleOrder.aggregate([
        {
            $match: {
                order_date: { $gte: sevenDaysAgo }
            }
        },
        {
            $lookup: {
                from: 'products', // The collection name for Product model (lowercase and pluralized by Mongoose)
                localField: 'product_id',
                foreignField: 'product_id',
                as: 'productInfo'
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
            $sort: { total_sales_revenue: -1 } // Sort by highest sales
        }
    ]);
}

async function getUnderperformingProducts() {
    const threeMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 3));

    return await Product.aggregate([
        {
            $match: {
                current_stock: { $gt: 500 }, // Example: products with more than 500 units in stock
                last_sold_date: { $lt: threeMonthsAgo } // And not sold in the last 3 months
            }
        },
        {
            $project: {
                _id: 0,
                product_id: 1,
                name: 1,
                category: 1,
                current_stock: 1,
                last_sold_date: 1,
                potential_loss_value: { $multiply: ['$current_stock', '$cost_price'] } // Value of current stock at cost
            }
        },
        {
            $sort: { potential_loss_value: -1 } // Sort by highest potential loss
        }
    ]);
}

async function getSupplierPerformance() {
    return await SaleOrder.aggregate([
        {
            $lookup: {
                from: 'products', // The collection name for Product model
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
                from: 'suppliers', // The collection name for Supplier model
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
            $sort: { total_sales_revenue: -1 } // Sort by highest sales per supplier
        }
    ]);
}

async function getProductsByTrendKeyword(keyword) {
    // This uses a simple regex search. For a real system, you'd use Atlas Search
    // with text indexes for better performance and relevance ranking.
    return await Product.find({
        $or: [
            { name: { $regex: new RegExp(keyword, 'i') } },
            { description: { $regex: new RegExp(keyword, 'i') } },
            { category: { $regex: new RegExp(keyword, 'i') } },
            { material: { $regex: new RegExp(keyword, 'i') } }
        ]
    }).limit(20); // Limit results for AI processing to avoid sending too much data to Gemini
}

module.exports = {
    getSalesProfitSnapshot,
    getUnderperformingProducts,
    getSupplierPerformance,
    getProductsByTrendKeyword
};