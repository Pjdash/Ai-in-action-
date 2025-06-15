require('dotenv').config();
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // To generate unique IDs
const Product = require('./models/Product'); // Adjust path if needed
const SaleOrder = require('./models/SaleOrder'); // Adjust path if needed
const Supplier = require('./models/Supplier'); // Adjust path if needed
const { generateContent } = require('./ai_service'); // If you use Gemini for descriptions

const csvFilePath = 'data/Fashion_Retail_Sales.csv'; // Path to your CSV file

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas!');

    const products = [];
    const saleOrders = [];
    const suppliers = new Set(); // Use a Set to track unique supplier IDs

    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', async (row) => {
        // 1. Generate IDs
        const productId = uuidv4();
        const orderId = uuidv4();

        // 2. Data Transformation (from Kaggle CSV to your schemas)
        const selling_price = parseFloat(row['Purchase Amount (USD)']);
        const cost_price = selling_price * (0.5 + Math.random() * 0.2); // Simulated cost
        const order_date = new Date(row['Date Purchase']); // Convert date string
        const return_status = Math.random() < 0.1; // 10% chance of return
        const discount_applied = Math.random() < 0.2 ? Math.random() * 0.2 : 0;
        const customer_id = row['Customer ID']; //Keep Customer ID

        //Simplified product name from the Kaggle dataset
        const itemName = row['Item Purchased'];

        // 3. Create Product Document (only if it's a new product)
        // Check if a product with the same name already exists
        let product = products.find(p => p.name === itemName);

        if (!product) {
            //If not, create a new product
            const supplierId = `SUP${Math.floor(Math.random() * 3) + 1}`; // Simulate supplier ID
            suppliers.add(supplierId);

            let description = "";

            //If you want to use Gemini for descriptions, uncomment the following block
            // try{
            //     description = await generateContent(`Generate a short, descriptive product description for a fashion item named "${itemName}". Include material, style, and a few keywords.`);
            // }catch(error){
            //     console.error("Gemini description generation failed:", error);
            //     description = "Generic fashion item description."; //Fallback
            // }

            product = {
                product_id: productId,
                name: itemName,
                category: "Unknown", // You can try to infer a category from the name here, or leave it as "Unknown"
                material: "Unknown", // You can try to infer a material from the name here, or leave it as "Unknown"
                description: description,
                cost_price: cost_price,
                selling_price: selling_price,
                supplier_id: supplierId,
                current_stock: Math.floor(Math.random() * 1000) + 100,
                last_sold_date: order_date,
            };
            products.push(product);


        } else {
            //If the product already exists, update the last_sold_date
            product.last_sold_date = order_date;
        }

        // 4. Create SaleOrder Document
        const saleOrder = {
          order_id: orderId,
          product_id: product.product_id,
          quantity: 1, // Most likely 1 purchase per row in this dataset
          price: selling_price,
          order_date: order_date,
          return_status: return_status,
          discount_applied: discount_applied,
          customer_id: customer_id,
        };
        saleOrders.push(saleOrder);
      })
      .on('end', async () => {
        // 5. Bulk Insert
        try {
          //Insert suppliers first
          const supplierDocs = Array.from(suppliers).map(supplierId => ({
            supplier_id: supplierId,
            name: `Supplier ${supplierId}`, // Simulated supplier name
            lead_time_days: Math.floor(Math.random() * 14) + 7, // 7-21 days
            quality_rating: Math.floor(Math.random() * 5) + 1, // 1-5
          }));
          await Supplier.insertMany(supplierDocs, { ordered: false }); // ordered: false allows parallel inserts

          await Product.insertMany(products, { ordered: false });
          await SaleOrder.insertMany(saleOrders, { ordered: false });
          console.log('Data import complete.');
        } catch (error) {
          console.error('Error during bulk insert:', error);
        } finally {
          await mongoose.disconnect();
          console.log('Disconnected from MongoDB.');
        }
      });
  } catch (error) {
    console.error('Error during data import:', error);
    await mongoose.disconnect();
  }
}

importData().catch(console.error);