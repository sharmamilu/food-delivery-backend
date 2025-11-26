const Order = require("../models/Order");
const User = require("../models/User"); // assuming you store user credits here

// ✅ Add New Order (and deduct credits)
exports.addOrder = async (req, res) => {
  try {
    const { userId, orderDetails } = req.body;
    console.log("req.body", req.body);

    // Calculate total amount for this order
    const totalAmount = orderDetails.reduce((acc, item) => acc + item.total, 0);

    // Find the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("Current credits:", user.credits);

    // Check if user has enough credits
    if (user.credits < totalAmount) {
      return res.status(400).json({ message: "Insufficient credits" });
    }

    // ✅ Deduct credits
    user.credits -= totalAmount;

    // ✅ Record a debit transaction
    user.transactions.push({
      type: "debit",
      amount: totalAmount,
      description: "Order payment deduction",
    });

    await user.save();

    // ✅ Save the order
    const order = new Order({
      userId,
      orderDetails,
      totalAmount,
    });
    await order.save();

    // ✅ Send response
    res.json({
      message: "Order placed successfully",
      order,
      remainingCredits: user.credits,
    });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// ✅ Get all orders of a user
exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
      credits: await User.findById(userId).select("credits"),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Server error" });
  }
};
