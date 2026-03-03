import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector
} from "recharts";
import { useSpring, animated } from "@react-spring/web";

interface AlertDistributionChartProps {
  total: number;
  activeCritical: number;
  activeWarning: number;
  resolved: number;
}

// const COLORS = ["#FF1744", "#FF6D00", "#00FFB2", "#00E5FF"];

const AlertDistributionChart: React.FC<AlertDistributionChartProps> = ({ total, activeCritical, activeWarning, resolved }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(() => {
      const rawData = [
        { name: "Active Critical", value: activeCritical, color: "#FF1744" },
        { name: "Active Warning", value: activeWarning, color: "#FF6D00" },
        { name: "Resolved", value: resolved, color: "#00FFB2" }
      ];
      
      const countedTotal = activeCritical + activeWarning + resolved;
      if (total > countedTotal) {
          rawData.push({ name: "Other", value: total - countedTotal, color: "#00E5FF" });
      }

      return rawData.filter(item => item.value > 0);
  }, [activeCritical, activeWarning, resolved, total]);


  const spring = useSpring({
    number: total,
    from: { number: 0 },
    config: { mass: 1, tension: 120, friction: 20 }
  });

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 18}
          fill={fill}
          style={{ filter: "url(#glow)" }}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "rgba(15, 23, 42, 0.9)", // Tailwind slate-900 with opacity
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid rgba(6, 182, 212, 0.3)", // Cyan border for cyberpunk feel
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
        }}>
          <strong className="text-gray-300 text-sm">{payload[0].name}</strong>
          <div className="text-2xl font-bold mt-1" style={{ color: payload[0].payload.fill }}>
              {payload[0].value}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-[350px] md:h-[400px] bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 rounded-2xl overflow-hidden border border-gray-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-center justify-between p-6 md:px-12">
      
      {/* Left: Legend / Stats Breakdown */}
      <div className="w-full md:w-1/3 flex flex-col justify-center space-y-6 mb-8 md:mb-0 relative z-10">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-wide">Alert Overview</h3>
            <p className="text-gray-400 text-sm mt-1">Real-time status of all reported anomalies.</p>
          </div>
          
          <div className="flex flex-col space-y-5 mt-4">
              {data.map((item, index) => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                  const color = item.color;
                  const isActive = activeIndex === index;
                  
                  return (
                      <div 
                          key={item.name} 
                          className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 cursor-pointer ${isActive ? 'bg-gray-800/80 shadow-lg' : 'hover:bg-gray-800/50'}`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                          style={{
                              borderLeft: isActive ? `3px solid ${color}` : '3px solid transparent'
                          }}
                      >
                          <div className="flex items-center space-x-3">
                              <div 
                                  className={`w-3 h-3 rounded-full transition-shadow duration-300 ${isActive ? 'scale-125' : ''}`} 
                                  style={{ 
                                      backgroundColor: color, 
                                      boxShadow: isActive ? `0 0 12px ${color}` : `0 0 4px ${color}` 
                                  }} 
                              />
                              <span className={`text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                  {item.name}
                              </span>
                          </div>
                          <div className="text-right">
                              <span className="text-white font-bold block">{item.value}</span>
                              <span className="text-xs text-gray-500">{percentage}%</span>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Right: Main Chart Content */}
      <div className="w-full md:w-2/3 h-full flex justify-center items-center relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              dataKey="value"
              // @ts-ignore
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationDuration={1500}
              stroke="none"
              cornerRadius={8}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(255,255,255,0.15))",
                    cursor: "pointer",
                    outline: 'none'
                  }}
                />
              ))}
            </Pie>

            <Tooltip content={<CustomTooltip />} />

            {/* Center Text Elements */}
            <animated.text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fill: "#F8FAFC", // Tailwind slate-50
                fontSize: "56px",
                fontWeight: "700",
                filter: "drop-shadow(0 0 15px rgba(255,255,255,0.2))"
              }}
            >
              {spring.number.to(n => n.toFixed(0))}
            </animated.text>

            <text
              x="50%"
              y="64%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fill: "#94A3B8", // Tailwind slate-400
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "4px",
                textTransform: "uppercase"
              }}
            >
              TOTAL
            </text>

          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default AlertDistributionChart;