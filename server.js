const express = require("express");
const app = express();
app.use(express.json({ limit: "50mb" })); // Increase JSON payload limit
app.use(express.urlencoded({ limit: "50mb", extended: true })); // Increase URL-encoded payload limit

const multer = require("multer");
const csvParser = require("csv-parser");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");

app.use(cors());

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Endpoint to handle file upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log("File uploaded:", req.file);

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      console.log("CSV data parsed:", results);
      fs.unlinkSync(req.file.path);

      const kpis = analyzeData(results);
      const insights = await generateInsights(results);

      res.json({ data: results, kpis, insights });
    });
});

// Function to analyze the data
const analyzeData = (data) => {
  const totalConversions = data.reduce((sum, row) => sum + parseInt(row.Conversions), 0);
  const totalAmountSpent = data.reduce((sum, row) => sum + parseFloat(row["Amount Spent"].replace("$", "")), 0);
  const averageCostPerConversion = totalAmountSpent / totalConversions;

  return {
    totalConversions,
    totalAmountSpent,
    averageCostPerConversion,
  };
};

// Function to generate insights using Ollama
const generateInsights = async (data) => {
  try {
    const response = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "llama2",
        prompt: `Analyze the following marketing data and provide insights:\n\n${JSON.stringify(
          data
        )}\n\nKey insights:`,
      },
      {
        responseType: "stream", // Handle streaming response
        timeout: 60000,
      }
    );

    let rawData = "";

    // Accumulate the streamed responses
    response.data.on("data", (chunk) => {
      rawData += chunk.toString(); // Convert chunk to string and append
    });

    // Wait for the stream to end and parse the complete JSON
    return new Promise((resolve, reject) => {
      response.data.on("end", () => {
        try {
          // Split the raw data by newlines and parse each JSON object
          const insights = rawData
            .split("\n") //Split the raw data into line
            .filter((line) => line.trim() !== "") // Remove empty lines
            .map((line) => JSON.parse(line)) // Parse each JSON object
            .map((obj) => obj.response) // Extract the "response" field
            .join(" "); // Combine all responses into a single string

          console.log("Final insights:", insights);
          resolve(insights);
        } catch (error) {
          console.error("Error parsing Ollama response:", error);
          reject("Failed to generate insights due to parsing error.");
        }
      });

      response.data.on("error", (error) => {
        console.error("Error in Ollama stream:", error);
        reject("Failed to generate insights.");
      });
    });
  } catch (error) {
    console.error("Error generating insights:", error.message);
    return "Failed to generate insights.";
  }
}; 

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});