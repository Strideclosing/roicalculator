import React, { useState, useMemo } from "react";
import { Chart, registerables } from "chart.js";
import { Line } from "react-chartjs-2";
import { Slider, MenuItem, Select, Switch, FormControlLabel } from "@mui/material";
import annotationPlugin from "chartjs-plugin-annotation";
import "./ROICalculator.css";

Chart.register(...registerables, annotationPlugin);

const growthMultipliers = {
  slow: { values: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], percentage: "~5% Growth" },
  medium: { values: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26], percentage: "~10% Growth" },
  fast: { values: [5, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48], percentage: "~20% Growth" },
};

const ROICalculator = () => {
  const [programCost, setProgramCost] = useState(10000);
  const [subscriptionCost, setSubscriptionCost] = useState(200);
  const [timeFrame, setTimeFrame] = useState(12);
  const [growthRate, setGrowthRate] = useState("medium");
  const [showAverageROI, setShowAverageROI] = useState(false);

  const attritionRate = 0.05;
  const months = useMemo(() => Array.from({ length: timeFrame }, (_, i) => i + 1), [timeFrame]);

  const { cumulativeRevenue, avgCumulativeRevenue, roiMonth } = useMemo(() => {
    let revenue = 0;
    let avgRevenue = 0;
    let totalClients = 0;
    let avgTotalClients = 0;
    let cumulativeRevenue = [];
    let avgCumulativeRevenue = [];
    let roiMonth = null;

    months.forEach((month, index) => {
      const newClients = growthMultipliers[growthRate].values[index] || growthMultipliers[growthRate].values.slice(-1)[0];
      totalClients += newClients;
      totalClients -= totalClients * attritionRate;
      revenue += totalClients * subscriptionCost;
      
      avgTotalClients += newClients * 0.75;
      avgTotalClients -= avgTotalClients * attritionRate;
      avgRevenue += avgTotalClients * (subscriptionCost * 0.8);
      avgRevenue = Math.min(avgRevenue, 4000 * month); // Cap avg revenue to $4k/month
      
      if (month <= 3) {
        revenue *= 1.5; // First 3 months get a 50% boost for ECA
      }
      
      cumulativeRevenue.push(revenue);
      avgCumulativeRevenue.push(avgRevenue);

      if (roiMonth === null && revenue >= programCost) {
        roiMonth = month;
      }
    });

    return { cumulativeRevenue, avgCumulativeRevenue, roiMonth };
  }, [programCost, subscriptionCost, growthRate, months]);

  const data = {
    labels: months,
    datasets: [
      {
        label: "Elite Coaching ROI ($)",
        data: cumulativeRevenue,
        borderColor: "#B8860B",
        borderWidth: 4,
        tension: 0.4,
      },
      showAverageROI && {
        label: "Average Coach ROI ($)",
        data: avgCumulativeRevenue,
        borderColor: "black",
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.4,
      },
    ].filter(Boolean),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      annotation: {
        annotations: roiMonth !== null ? {
          roiLine: {
            type: "line",
            xMin: roiMonth,
            xMax: roiMonth,
            borderColor: "green",
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              content: "ROI Point",
              enabled: true,
              position: "top",
              color: "green",
              font: { size: 12, weight: "bold" },
            },
          },
        } : {},
      },
    },
  };

  return (
    <div className="container" style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#fff", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
      <h2 className="title" style={{ marginBottom: "10px", textAlign: "center", color: "#B8860B" }}>ROI Calculator</h2>
      <FormControlLabel
        control={<Switch checked={showAverageROI} onChange={() => setShowAverageROI(!showAverageROI)} />}
        label="Compare to Average Coach ROI"
        style={{ marginBottom: "10px", textAlign: "center" }}
      />
      <div className="chart-container" style={{ height: "400px", width: "100%" }}>
        <Line data={data} options={options} />
      </div>
      <div className="controls-layout" style={{ display: "flex", justifyContent: "space-between", width: "100%", paddingTop: "20px" }}>
        <div className="sliders" style={{ width: "55%" }}>
          <label style={{ fontWeight: "bold" }}>Program Cost: ${programCost.toLocaleString()}</label>
          <Slider value={programCost} onChange={(e, val) => setProgramCost(val)} min={8500} max={15000} step={500} sx={{ color: "#B8860B", height: 8 }} />
          <label style={{ fontWeight: "bold" }}>Subscription Cost: ${subscriptionCost.toLocaleString()}</label>
          <Slider value={subscriptionCost} onChange={(e, val) => setSubscriptionCost(val)} min={50} max={500} step={10} sx={{ color: "#B8860B", height: 8 }} />
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
