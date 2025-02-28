import React, { useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Card, CardContent, Typography, CircularProgress, Box } from "@mui/material"; // Import Material-UI components
import InsightsIcon from "@mui/icons-material/Insights"; // Import an icon for insights

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const App = () => {
  const [kpis, setKpis] = useState(null);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true); // Show loading spinner
    try {
      const response = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Backend response:", response.data);
      setKpis(response.data.kpis);
      setInsights(response.data.insights);
    } catch (error) {
      console.error("Error uploading file:", error.message);
      alert("Failed to upload file. Please check the file size and try again.");
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  // Chart data (example)
  const chartData = {
    labels: ["Total Conversions", "Total Amount Spent", "Average Cost per Conversion"],
    datasets: [
      {
        label: "KPI Values",
        data: kpis
          ? [kpis.totalConversions, kpis.totalAmountSpent, kpis.averageCostPerConversion]
          : [0, 0, 0], // Default values to avoid errors
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)", // Teal
          "rgba(153, 102, 255, 0.6)", // Purple
          "rgba(255, 159, 64, 0.6)", // Orange
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)", // Teal
          "rgba(153, 102, 255, 1)", // Purple
          "rgba(255, 159, 64, 1)", // Orange
        ],
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Marketing KPIs",
        font: {
          size: 18,
        },
      },
    },
    animation: {
      duration: 1000, // Animation duration
    },
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", color: "#2c3e50" }}>CSV Analysis Dashboard</h1>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ marginBottom: "20px", display: "block", margin: "0 auto" }}
      />

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      )}

      {kpis && !loading && (
        <div>
          <h2 style={{ textAlign: "center", color: "#34495e" }}>Analysis Results</h2>
          <Bar data={chartData} options={chartOptions} />
          <div style={{ marginTop: "20px" }}>
            <Typography variant="h6" style={{ color: "#2c3e50" }}>
              Total Conversions: <strong>{kpis.totalConversions}</strong>
            </Typography>
            <Typography variant="h6" style={{ color: "#2c3e50" }}>
              Total Amount Spent: <strong>${kpis.totalAmountSpent.toFixed(2)}</strong>
            </Typography>
            <Typography variant="h6" style={{ color: "#2c3e50" }}>
              Average Cost per Conversion: <strong>${kpis.averageCostPerConversion.toFixed(2)}</strong>
            </Typography>
          </div>

          <Card style={{ marginTop: "20px", backgroundColor: "#f5f5f5" }}>
            <CardContent>
              <Box display="flex" alignItems="center" marginBottom="10px">
                <InsightsIcon style={{ marginRight: "10px", color: "#3498db" }} />
                <Typography variant="h5" style={{ color: "#2c3e50" }}>
                  Insights from Ollama
                </Typography>
              </Box>
              <Typography variant="body1" style={{ color: "#34495e", lineHeight: "1.6" }}>
                {insights}
              </Typography>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default App;