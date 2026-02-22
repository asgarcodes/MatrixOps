'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

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

export function Sparkline({ data, className, color = 'rgb(59, 130, 246)' }: SparklineProps) {
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
    }).join(' ')

    return (
        <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className={cn('w-full h-full', className)}
        >
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

interface LineChartProps {
    data: { label: string; value: number }[]
    className?: string
}

export function LineChart({ data, className }: LineChartProps) {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

    const max = Math.max(...data.map(d => d.value))
    const min = Math.min(...data.map(d => d.value))
    const range = max - min || 1

    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((item.value - min) / range) * 80 - 10
        return { x, y, ...item }
    })

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const areaD = `${pathD} L 100 100 L 0 100 Z`

    return (
        <div className={cn('relative w-full h-full', className)}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#chartGradient)" />
                <path d={pathD} fill="none" stroke="rgb(59, 130, 246)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                {points.map((point, index) => (
                    <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r={hoveredIndex === index ? "1.5" : "0.8"}
                        fill="rgb(59, 130, 246)"
                        className="transition-all cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    />
                ))}
            </svg>
            {hoveredIndex !== null && (
                <div
                    className="absolute bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl pointer-events-none"
                    style={{
                        left: `${points[hoveredIndex].x}%`,
                        top: `${points[hoveredIndex].y}%`,
                        transform: 'translate(-50%, -120%)'
                    }}
                >
                    <div className="font-semibold">{points[hoveredIndex].label}</div>
                    <div className="text-accent">₹{points[hoveredIndex].value.toLocaleString()}</div>
                </div>
            )}
        </div>
    )
}
