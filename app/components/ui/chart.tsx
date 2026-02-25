'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function ChartContainer({ children, className, ...props }: ChartContainerProps) {
    return (
        <div className={cn('w-full h-full', className)} {...props}>
            {children}
        </div>
    )
}

interface SparklineProps {
    data: number[]
    className?: string
    color?: string
}

export function Sparkline({ data, className, color = 'hsl(221.2, 83.2%, 53.3%)' }: SparklineProps) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const width = 200
    const height = 60
    const padding = 2

    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * (width - padding * 2)
        const y = padding + (1 - (value - min) / range) * (height - padding * 2)
        return { x, y }
    })

    // Generate smooth cubic bezier path
    const linePath = generateSmoothPath(points)
    // Area path for gradient fill
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

    const gradientId = React.useId()

    return (
        <motion.svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className={cn('w-full h-full', className)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        >
            <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <motion.path
                d={areaPath}
                fill={`url(#${gradientId})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
            />
            <motion.path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
        </motion.svg>
    )
}

interface LineChartProps {
    data: { label: string; value: number }[]
    className?: string
}

export function LineChart({ data, className }: LineChartProps) {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const svgWidth = 600
    const svgHeight = 200
    const paddingX = 40
    const paddingY = 20
    const chartWidth = svgWidth - paddingX * 2
    const chartHeight = svgHeight - paddingY * 2

    const max = Math.max(...data.map(d => d.value))
    const min = Math.min(...data.map(d => d.value))
    const range = max - min || 1

    const points = data.map((item, index) => {
        const x = paddingX + (index / (data.length - 1)) * chartWidth
        const y = paddingY + (1 - (item.value - min) / range) * chartHeight
        return { x, y, ...item }
    })

    const linePath = generateSmoothPath(points)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`

    // Y-axis labels
    const yLabels = Array.from({ length: 5 }, (_, i) => {
        const value = min + (range / 4) * i
        const y = paddingY + (1 - (value - min) / range) * chartHeight
        return { value, y }
    })

    // X-axis labels (show every 5th)
    const xLabels = points.filter((_, i) => i % 5 === 0 || i === points.length - 1)

    return (
        <motion.div
            ref={containerRef}
            className={cn('relative w-full h-full', className)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="lineChartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(221.2, 83.2%, 53.3%)" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="hsl(221.2, 83.2%, 53.3%)" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="hsl(221.2, 83.2%, 53.3%)" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Grid lines */}
                {yLabels.map((label, i) => (
                    <line
                        key={`grid-${i}`}
                        x1={paddingX}
                        x2={svgWidth - paddingX}
                        y1={label.y}
                        y2={label.y}
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                        strokeDasharray="4 4"
                        opacity="0.5"
                    />
                ))}

                {/* Y-axis labels */}
                {yLabels.map((label, i) => (
                    <text
                        key={`y-label-${i}`}
                        x={paddingX - 8}
                        y={label.y + 3}
                        textAnchor="end"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="7"
                        fontFamily="Inter, system-ui, sans-serif"
                    >
                        ₹{(label.value / 1000).toFixed(1)}k
                    </text>
                ))}

                {/* X-axis labels */}
                {xLabels.map((label, i) => (
                    <text
                        key={`x-label-${i}`}
                        x={label.x}
                        y={svgHeight - 4}
                        textAnchor="middle"
                        fill="hsl(var(--muted-foreground))"
                        fontSize="7"
                        fontFamily="Inter, system-ui, sans-serif"
                    >
                        {label.label}
                    </text>
                ))}

                {/* Area fill */}
                <motion.path
                    d={areaPath}
                    fill="url(#lineChartGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                />

                {/* Main line */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="hsl(221.2, 83.2%, 53.3%)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#glow)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                />

                {/* Data points - only show hovered or every 5th */}
                {points.map((point, index) => {
                    const isHovered = hoveredIndex === index
                    const showDot = isHovered || index % 5 === 0

                    return (
                        <g key={index}>
                            {/* Invisible hit area */}
                            <rect
                                x={point.x - (chartWidth / data.length) / 2}
                                y={paddingY}
                                width={chartWidth / data.length}
                                height={chartHeight}
                                fill="transparent"
                                className="cursor-crosshair"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            />
                            {/* Vertical hover line */}
                            {isHovered && (
                                <line
                                    x1={point.x}
                                    x2={point.x}
                                    y1={paddingY}
                                    y2={svgHeight - paddingY}
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="0.5"
                                    strokeDasharray="3 3"
                                    opacity="0.4"
                                />
                            )}
                            {/* Dot */}
                            {showDot && (
                                <>
                                    {isHovered && (
                                        <circle
                                            cx={point.x}
                                            cy={point.y}
                                            r="6"
                                            fill="hsl(221.2, 83.2%, 53.3%)"
                                            opacity="0.15"
                                        />
                                    )}
                                    <circle
                                        cx={point.x}
                                        cy={point.y}
                                        r={isHovered ? "3" : "1.5"}
                                        fill={isHovered ? "hsl(221.2, 83.2%, 53.3%)" : "hsl(221.2, 83.2%, 53.3%)"}
                                        stroke={isHovered ? "hsl(var(--background))" : "none"}
                                        strokeWidth="1.5"
                                        className="transition-all duration-150"
                                    />
                                </>
                            )}
                        </g>
                    )
                })}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && (
                <motion.div
                    className="absolute bg-popover/95 backdrop-blur-xl border border-border rounded-lg px-3.5 py-2.5 shadow-2xl shadow-black/30 pointer-events-none z-10"
                    style={{
                        left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
                        top: `${(points[hoveredIndex].y / svgHeight) * 100}%`,
                        transform: 'translate(-50%, -130%)'
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                >
                    <div className="text-[10px] font-medium text-muted-foreground">{points[hoveredIndex].label}</div>
                    <div className="text-sm font-bold text-accent">₹{points[hoveredIndex].value.toLocaleString()}</div>
                </motion.div>
            )}
        </motion.div>
    )
}

/**
 * Generates a smooth SVG path using Catmull-Rom to cubic bezier conversion
 */
function generateSmoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return ''
    if (points.length === 2) {
        return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
    }

    let path = `M ${points[0].x} ${points[0].y}`

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[Math.min(points.length - 1, i + 2)]

        const tension = 0.3

        const cp1x = p1.x + (p2.x - p0.x) * tension
        const cp1y = p1.y + (p2.y - p0.y) * tension
        const cp2x = p2.x - (p3.x - p1.x) * tension
        const cp2y = p2.y - (p3.y - p1.y) * tension

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    return path
}
