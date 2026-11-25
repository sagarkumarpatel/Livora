if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Livora backend listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start backend server:", err);
    process.exit(1);
  }
}

startServer();
