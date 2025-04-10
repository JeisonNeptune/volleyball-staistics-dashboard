import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell, // 👈 Add these two
} from "recharts";
import teamStyles from "../assets/teamStyles";

function downloadCSV(data, filename = "data.csv") {
  const csvRows = [];

  // Headers
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(","));

  // Rows
  for (const row of data) {
    const values = headers.map(h => `"${row[h] ?? ""}"`);
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


function getContrastText(hexColor) {
  const c = hexColor.substring(1); // remove #
  const rgb = parseInt(c, 16); // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? "#000000" : "#ffffff";
}

const getBarColor = (teamName) => {
  const style = teamStyles[teamName];
  return style?.color || "#8884d8"; // default color if team not found
};

const StatDashboard = () => {
  const [statOptions, setStatOptions] = useState([]);
  const [selectedStat, setSelectedStat] = useState("");
  const [originalData, setOriginalData] = useState([]);
  const [statData, setStatData] = useState([]);
  const [topCount, setTopCount] = useState(10);
  const [valueKey, setValueKey] = useState("Per Set");
  const [availableColumns, setAvailableColumns] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/stats").then((res) => {
      setStatOptions(res.data);
      setSelectedStat(res.data[0]); // auto-select first stat
    });
  }, []);

  useEffect(() => {
    if (selectedStat) {
      axios
        .get(`http://localhost:5000/api/stat/${selectedStat}`)
        .then((res) => {
          setOriginalData(res.data.data);

          const firstRow = res.data.data[0];
          const keys = Object.keys(firstRow).filter(
            (k) => k !== "Team" && k !== "Rank"
          );
          setAvailableColumns(keys); // dynamically get available stat columns

          setValueKey(res.data.value_column); // default one from backend
        });
    }
  }, [selectedStat]);

  useEffect(() => {
    if (topCount > 0) {
      setStatData(originalData.slice(0, topCount));
    } else {
      setStatData(originalData);
    }
  }, [originalData, topCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="p-8">
          <h2 className="text-4xl font-extrabold text-blue-800 mb-8 text-center">
             NCAA Men's Volleyball Dashboard
          </h2>

          {/* Stat Selector */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 grid gap-4 sm:grid-cols-3">
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
  <div className="flex flex-wrap gap-2">
    {statOptions.map((stat) => (
      <button
        key={stat}
        onClick={() => setSelectedStat(stat)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          selectedStat === stat
            ? 'bg-blue-700 text-blue-100'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        }`}
      >
        {stat.replace(/_/g, " ")}
      </button>
    ))}
  </div>
</div>
<div className="bg-white rounded-xl shadow-md p-4 mb-6 grid gap-4 sm:grid-cols-2">
  <select
    className="p-2 border rounded"
    value={topCount}
    onChange={(e) => setTopCount(Number(e.target.value))}
  >
    <option value={5}>Top 5</option>
    <option value={10}>Top 10</option>
    <option value={20}>Top 20</option>
    <option value={0}>Show All</option>
  </select>

  <select
    className="p-2 border rounded"
    value={valueKey}
    onChange={(e) => setValueKey(e.target.value)}
  >
    {availableColumns.map((col) => (
      <option key={col} value={col}>
        {col.replace(/_/g, " ")}
      </option>
    ))}
  </select>
</div>

          </div>

          <div className="bg-white shadow-lg rounded-xl p-6 mb-10">
            <h3 className="text-xl font-bold mb-4 text-blue-700 text-center">
              {valueKey.replace(/_/g, " ")} by Team
            </h3>
            {statData.length > 0 && (
              <div className="flex justify-end mb-4 gap-4">    <button
      onClick={() => downloadCSV(statData, `${selectedStat}.csv`)}
      className="bg-blue-600 text-blue px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      Download CSV
    </button>
  </div>
)}

            {/* Responsive Chart */}
            {statData.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={statData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Team" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey={valueKey}
                    name="Stat"
                    isAnimationActive={true}
                    label={{ position: "top" }}
                  >
                    {statData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.Team)} // 👈 uses your helper function
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stat Table */}
          {statData.length > 0 && (
            <div className="mt-8 overflow-x-auto">
              <h3 className="text-xl font-bold mb-4 text-blue-700">
                Stat Table
              </h3>
              <table className="table-auto w-full text-sm">
                <thead className="bg-gray-100 text-gray-700 uppercase">
                  <tr>
                    {Object.keys(statData[0]).map((key) => (
                      <th
                        key={key}
                        className="border px-4 py-2 bg-gray-100 text-left"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {statData.map((row, idx) => {
                    const team = row.Team;
                    const style = teamStyles[team] || {
                      color: "#f3f4f6", // default light gray background
                      logo: "",
                    };

                    // Optional: basic contrast check
                    const textColor = getContrastText(style.color);

                    return (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor: style.color,
                          color: textColor,
                        }}
                      >
                        {Object.entries(row).map(([key, val], i) => (
                          <td key={i} className="border px-4 py-2">
                            {key === "Team" ? (
                              <div className="flex items-center gap-2">
                                {style.logo && (
                                  <img
                                    src={style.logo}
                                    alt={`${team} logo`}
                                    className="w-6 h-6 object-contain"
                                    style={{
                                      maxWidth: "30px",
                                      maxHeight: "24px",
                                      paddingRight: "4px",
                                    }}
                                    onError={(e) =>
                                      (e.target.style.display = "none")
                                    }
                                  />
                                )}
                                <span>{val}</span>
                              </div>
                            ) : (
                              val
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <footer className="mt-12 text-center text-sm text-gray-400">
  Built by Jeison Neptune • Powered by Flask & React
</footer>
    </div>
    
  );
};

export default StatDashboard;
