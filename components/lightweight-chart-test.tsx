'use client'

import { useEffect, useRef } from 'react'
import * as LightweightCharts from 'lightweight-charts'

interface PriceChartProps {
  ticker: string
  contract: string
  network: string
  priceAtCall?: number
  athPrice?: number
  callTimestamp?: string
}

// Sample data for testing - in real implementation, this would come from GeckoTerminal API
const generateSampleData = (basePrice: number): LightweightCharts.CandlestickData[] => {
  const data: LightweightCharts.CandlestickData[] = []
  const now = Math.floor(Date.now() / 1000)
  const startTime = now - 30 * 24 * 60 * 60 // 30 days ago
  
  let currentPrice = basePrice * 0.5 // Start at half the base price
  
  for (let time = startTime; time <= now; time += 3600) { // Hourly candles
    const volatility = 0.02
    const trend = time < (startTime + 15 * 24 * 60 * 60) ? 1.00005 : 0.99995 // Uptrend first half, downtrend second
    
    const open = currentPrice
    const close = currentPrice * trend * (1 + (Math.random() - 0.5) * volatility)
    const high = Math.max(open, close) * (1 + Math.random() * volatility / 2)
    const low = Math.min(open, close) * (1 - Math.random() * volatility / 2)
    
    data.push({
      time: time as any,
      open,
      high,
      low,
      close
    })
    
    currentPrice = close
  }
  
  return data
}

export function LightweightChartTest({ 
  ticker, 
  contract, 
  network, 
  priceAtCall = 0.0152,
  athPrice = 0.3301,
  callTimestamp 
}: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<LightweightCharts.IChartApi | null>(null)
  const seriesRef = useRef<LightweightCharts.ISeriesApi<"Candlestick"> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart
    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2a2a' },
        horzLines: { color: '#2a2a2a' },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })
    
    seriesRef.current = candlestickSeries

    // Set data (sample data for testing)
    const data = generateSampleData(priceAtCall)
    candlestickSeries.setData(data)

    // Add buy price line
    const buyPriceLine = candlestickSeries.createPriceLine({
      price: priceAtCall,
      color: '#26a69a',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: `Entry: $${priceAtCall.toFixed(6)}`,
    })

    // Add ATH price line
    const athPriceLine = candlestickSeries.createPriceLine({
      price: athPrice,
      color: '#ff5252',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: `ATH: $${athPrice.toFixed(4)} (+${((athPrice / priceAtCall - 1) * 100).toFixed(0)}%)`,
    })

    // Add current price line (optional)
    const currentPrice = data[data.length - 1].close
    const currentPriceLine = candlestickSeries.createPriceLine({
      price: currentPrice,
      color: '#2196f3',
      lineWidth: 2,
      lineStyle: 0, // Solid
      axisLabelVisible: true,
      title: `Now: $${currentPrice.toFixed(6)}`,
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        })
      }
    }
    
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [ticker, priceAtCall, athPrice])

  return (
    <div className="w-full bg-gray-900 rounded-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{ticker} - Lightweight Charts Test</h3>
        <p className="text-sm text-gray-400">
          Contract: {contract} ({network})
        </p>
        <div className="mt-2 flex gap-6 text-sm">
          <span className="text-green-400">Entry: ${priceAtCall}</span>
          <span className="text-red-400">ATH: ${athPrice} (+{((athPrice / priceAtCall - 1) * 100).toFixed(0)}%)</span>
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" />
      <div className="mt-4 text-xs text-gray-500">
        <p>* This is sample data for testing. Real implementation would fetch from GeckoTerminal API.</p>
        <p>* Price lines show Entry (green), ATH (red), and Current (blue) prices with labels.</p>
      </div>
    </div>
  )
}