const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
// app.use(express.json());
app.use(express.json({ limit: '10mb' })); // Add limit: '10mb'
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Also add for URL encoded

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/credits", require("./routes/credit"));
app.use("/api/subscription", require("./routes/subscription"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/food", require("./routes/foodRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/user", require("./routes/user"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/usorder", require("./routes/usorderRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
