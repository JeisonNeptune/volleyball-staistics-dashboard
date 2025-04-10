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
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">NCAA Men's Volleyball Stats</h2>

      {/* Stat Selector */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <select
          className="p-2 border rounded w-full sm:w-1/3"
          value={selectedStat}
          onChange={(e) => setSelectedStat(e.target.value)}
        >
          {statOptions.map((stat) => (
            <option key={stat} value={stat}>
              {stat.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        {/* Top X Filter */}
        <select
          className="p-2 border rounded w-full sm:w-1/3"
          value={topCount}
          onChange={(e) => setTopCount(Number(e.target.value))}
        >
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={0}>Show All</option>
        </select>
      </div>
      {/* Y-Axis Stat Selector (this is Option 3!) */}
      <select
        className="p-2 border rounded w-full sm:w-1/3"
        value={valueKey}
        onChange={(e) => setValueKey(e.target.value)}
      >
        {availableColumns.map((col) => (
          <option key={col} value={col}>
            {col.replace(/_/g, " ")}
          </option>
        ))}
      </select>

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

      {/* Stat Table */}
      {statData.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <h3 className="text-xl font-semibold mb-2">Stat Table</h3>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
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
            <tbody>
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
                    style={{ backgroundColor: style.color, color: textColor }}
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
  );
};

export default StatDashboard;
