import React, { useState, useMemo, useEffect } from "react";
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

const AlertDistributionChart: React.FC<AlertDistributionChartProps> = ({ total, activeCritical, activeWarning, resolved }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [themeKey, setThemeKey] = useState(0);

  // Force re-render when theme changes to ensure SVG text renders correctly
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setThemeKey(prev => prev + 1);
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => {
      const rawData = [
        { name: "Active Critical", value: activeCritical, color: "#FF1744" },
        { name: "Active Warning", value: activeWarning, color: "#FF6D00" },
        { name: "Resolved", value: resolved, color: "#00C853" } // Darker green for contrast
      ];
      
      const countedTotal = activeCritical + activeWarning + resolved;
      if (total > countedTotal) {
          rawData.push({ name: "Other", value: total - countedTotal, color: "#0091EA" });
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
          style={{ filter: document.body.classList.contains('light-mode') ? "none" : "url(#glow)" }}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isLight = document.body.classList.contains('light-mode');
      return (
        <div style={{
          background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.9)",
          padding: "12px 16px",
          borderRadius: "12px",
          border: isLight ? "1px solid rgba(0, 0, 0, 0.1)" : "1px solid rgba(6, 182, 212, 0.3)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
        }}>
          <strong className={isLight ? "text-gray-900 text-sm" : "text-gray-300 text-sm"}>{payload[0].name}</strong>
          <div className="text-2xl font-bold mt-1" style={{ color: payload[0].payload.fill }}>
              {payload[0].value}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative w-full h-auto min-h-[450px] md:h-[400px] bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 light:from-white light:via-gray-50 light:to-gray-100 rounded-2xl overflow-hidden border border-gray-800 light:border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.4)] light:shadow-lg flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 md:px-12">
      
      {/* Left: Legend / Stats Breakdown */}
      <div className="w-full md:w-1/3 flex flex-col justify-center space-y-4 md:space-y-6 mb-4 md:mb-0 relative z-10">
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-bold text-white light:text-gray-900 tracking-wide">Alert Overview</h3>
            <p className="text-gray-400 light:text-gray-600 text-[10px] md:text-sm mt-1 uppercase font-black tracking-widest opacity-80">Real-time status of all reported anomalies.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-5 mt-2 md:mt-4">
              {data.map((item, index) => {
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
                  const color = item.color;
                  const isActive = activeIndex === index;
                  
                  return (
                      <div 
                          key={item.name} 
                          className={`flex items-center justify-between p-2 md:p-3 rounded-xl transition-all duration-300 cursor-pointer ${isActive ? 'bg-gray-800/80 light:bg-cyan-100/50 shadow-lg' : 'hover:bg-gray-800/50 light:hover:bg-gray-100'} border border-transparent ${isActive ? 'light:border-cyan-200' : ''}`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                          style={{
                              borderLeft: isActive ? `4px solid ${color}` : '4px solid transparent'
                          }}
                      >
                          <div className="flex items-center space-x-2 md:space-x-3">
                              <div 
                                  className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-shadow duration-300 ${isActive ? 'scale-125' : ''}`} 
                                  style={{ 
                                      backgroundColor: color, 
                                      boxShadow: isActive && !document.body.classList.contains('light-mode') ? `0 0 12px ${color}` : `none` 
                                  }} 
                              />
                              <span className={`text-[10px] md:text-sm font-bold transition-colors ${isActive ? 'text-white light:text-gray-900' : 'text-gray-300 light:text-gray-600'}`}>
                                  {item.name}
                              </span>
                          </div>
                          <div className="text-right">
                              <span className="text-white light:text-gray-900 text-xs md:text-base font-black block">{item.value}</span>
                              <span className="text-[9px] md:text-xs text-gray-500 font-bold">{percentage}%</span>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* Right: Main Chart Content */}
      <div className="w-full md:w-2/3 h-[250px] sm:h-[300px] md:h-full flex justify-center items-center relative z-10">
        <ResponsiveContainer width="100%" height="100%" key={themeKey}>
          <PieChart>
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={5}
              dataKey="value"
              // @ts-expect-error recharts ActiveShape types are incomplete
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
                    filter: document.body.classList.contains('light-mode') ? "none" : "drop-shadow(0 0 12px rgba(255,255,255,0.15))",
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
                fill: document.body.classList.contains('light-mode') ? "#111827" : "#F8FAFC",
                fontSize: window.innerWidth < 640 ? "32px" : "56px",
                fontWeight: "900",
                filter: document.body.classList.contains('light-mode') ? "none" : "drop-shadow(0 0 15px rgba(255,255,255,0.2))"
              }}
            >
              {spring.number.to(n => n.toFixed(0))}
            </animated.text>

            <text
              x="50%"
              y={window.innerWidth < 640 ? "60%" : "64%"}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fill: document.body.classList.contains('light-mode') ? "#4B5563" : "#94A3B8",
                fontSize: window.innerWidth < 640 ? "10px" : "14px",
                fontWeight: "800",
                letterSpacing: window.innerWidth < 640 ? "2px" : "4px",
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
