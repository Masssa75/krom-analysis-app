import { PriceOverlayDemo } from '@/components/price-overlay-demo'

export default function TestChartPage() {
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Price Overlay Demo - GeckoTerminal with Labels</h1>
      
      <div className="space-y-8">
        {/* Test with T Token data */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Example 1: T Token (Arbitrum)</h2>
          <PriceOverlayDemo
            ticker="T"
            contract="0x30a538eFFD91ACeFb1b12CE9Bc0074eD18c9dFc9"
            network="arbitrum"
            priceAtCall={0.0152}
            athPrice={0.3301}
            currentPrice={0.0895}
          />
        </div>

        {/* Test with smaller prices */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Example 2: BUNKER Token (Solana)</h2>
          <PriceOverlayDemo
            ticker="BUNKER"
            contract="8NCievmJCg2d9Vc2TWgz2HkE6ANeSX7kwvdq5AL7pump"
            network="solana"
            priceAtCall={0.00230}
            athPrice={0.009786}
            currentPrice={0.00456}
          />
        </div>

        {/* Test with extreme small prices */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Example 3: Micro Cap Token</h2>
          <PriceOverlayDemo
            ticker="MICRO"
            contract="0x1234567890123456789012345678901234567890"
            network="ethereum"
            priceAtCall={0.00000234}
            athPrice={0.00001567}
            currentPrice={0.00000789}
          />
        </div>
      </div>

      <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">Price Overlay Features:</h3>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Floating price labels overlay on GeckoTerminal iframe</li>
          <li>Entry price (green), ATH (red), and Current (blue) badges</li>
          <li>Percentage calculations shown inline</li>
          <li>Bottom bar with all prices for easy comparison</li>
          <li>Non-intrusive - chart remains fully interactive</li>
          <li>Works with existing GeckoTerminal embeds</li>
          <li>No additional charting library needed</li>
        </ul>

        <h3 className="font-semibold mt-4 mb-2">Implementation Notes:</h3>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>Uses absolute positioning to overlay labels on iframe</li>
          <li>Labels have pointer-events-none to not block chart interaction</li>
          <li>Can easily integrate into existing GeckoTerminalPanel component</li>
          <li>Minimal performance impact - no additional libraries</li>
          <li>Responsive and works on all screen sizes</li>
          <li>Easy to customize colors, positions, and styles</li>
        </ul>
      </div>
    </div>
  )
}