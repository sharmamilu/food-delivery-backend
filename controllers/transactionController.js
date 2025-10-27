const User = require("../models/User");

const getUserTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ✅ Fetch user with only the required fields
    const user = await User.findById(userId).select("name email credits transactions");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ Return only what you want
    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        credits: user.credits,
        transactions: user.transactions,
      },
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { getUserTransactions };
