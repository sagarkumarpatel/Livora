const dns = require("dns");
const mongoose = require("mongoose");

/**
 * Connects to MongoDB Atlas using ATLASHDB_URL (or MONGODB_URI fallback).
 */
async function connectDB() {
  const dbUrl = process.env.ATLASHDB_URL || process.env.MONGODB_URI;
  if (!dbUrl) {
    throw new Error(
      "Missing MongoDB Atlas connection string. Set ATLASHDB_URL in backend/.env."
    );
  }

  // Workaround for Node.js on Windows when c-ares defaults to 127.0.0.1 for SRV lookups
  const currentDns = dns.getServers();
  if (
    dbUrl.startsWith("mongodb+srv://") &&
    currentDns.length === 1 &&
    currentDns[0] === "127.0.0.1"
  ) {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  }

  try {
    await mongoose.connect(dbUrl);
  } catch (err) {
    if (
      dbUrl.startsWith("mongodb+srv://") &&
      err?.message?.includes("querySrv")
    ) {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      await mongoose.connect(dbUrl);
    } else {
      throw err;
    }
  }
  console.log("Connected to MongoDB Atlas");
}

module.exports = connectDB;
