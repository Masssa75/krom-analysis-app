'use client'

import { Shield, Lock, Unlock, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface SecurityDisplayProps {
  liquidityLocked?: boolean | null
  liquidityLockPercent?: number | null
  ownershipRenounced?: boolean | null
  securityScore?: number | null
  securityWarnings?: string[] | null
  securityCheckedAt?: string | null
  securityRawData?: any | null
  ticker?: string
}

export function SecurityDisplay({
  liquidityLocked,
  liquidityLockPercent,
  ownershipRenounced,
  securityScore,
  securityWarnings,
  securityCheckedAt,
  securityRawData,
  ticker = 'Token'
}: SecurityDisplayProps) {
  // If no security data, show nothing
  if (securityScore === null && liquidityLocked === null) {
    return null
  }

  // Determine icon and color based on security status
  const getSecurityIcon = () => {
    if (liquidityLocked === true) {
      return <Lock className="h-4 w-4" />
    } else if (liquidityLocked === false) {
      return <Unlock className="h-4 w-4" />
    } else if (securityScore !== null && securityScore !== undefined && securityScore < 50) {
      return <AlertTriangle className="h-4 w-4" />
    } else {
      return <Shield className="h-4 w-4" />
    }
  }

  const getSecurityColor = () => {
    if (securityScore === null || securityScore === undefined) return 'text-muted-foreground'
    if (securityScore >= 80) return 'text-green-600'
    if (securityScore >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  // Parse LP holders from raw data if available
  const lpHolders = securityRawData?.lp_holders || []
  const totalLpHolders = lpHolders.length
  const lockedHolders = lpHolders.filter((h: any) => h.is_locked === 1)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-1 h-auto cursor-pointer",
            getSecurityColor()
          )}
        >
          {getSecurityIcon()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Security Analysis - {ticker}</DialogTitle>
          <DialogDescription>
            Token security information from GoPlus API
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Security Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Security Score</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-lg font-bold", getSecurityColor())}>
                {securityScore !== null ? `${securityScore}/100` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Liquidity Lock Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Liquidity Lock</span>
            <div className="flex items-center gap-2">
              {liquidityLocked === true ? (
                <>
                  <Lock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    Locked {liquidityLockPercent ? `(${liquidityLockPercent.toFixed(2)}%)` : ''}
                  </span>
                </>
              ) : liquidityLocked === false ? (
                <>
                  <Unlock className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Not Locked</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Unknown</span>
              )}
            </div>
          </div>

          {/* Ownership Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Ownership</span>
            <span className={cn(
              "text-sm",
              ownershipRenounced ? "text-green-600" : "text-yellow-600"
            )}>
              {ownershipRenounced === true ? 'Renounced ✓' : ownershipRenounced === false ? 'Not Renounced' : 'Unknown'}
            </span>
          </div>

          {/* Warnings */}
          {securityWarnings && securityWarnings.length > 0 && (
            <div>
              <span className="text-sm font-medium text-red-600">⚠️ Warnings:</span>
              <ul className="mt-1 space-y-1">
                {securityWarnings.map((warning, index) => (
                  <li key={index} className="text-sm text-red-600 ml-4">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LP Distribution */}
          {totalLpHolders > 0 && (
            <div>
              <span className="text-sm font-medium">LP Distribution ({totalLpHolders} holders):</span>
              <div className="mt-2 space-y-1">
                {lpHolders.slice(0, 5).map((holder: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="font-mono truncate max-w-[200px]">
                      {holder.address === '0x000000000000000000000000000000000000dead' ? 'Dead Address' :
                       holder.address === '0x0000000000000000000000000000000000000000' ? 'Zero Address' :
                       `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{(parseFloat(holder.percent) * 100).toFixed(2)}%</span>
                      {holder.is_locked === 1 && <Lock className="h-3 w-3 text-green-600" />}
                    </div>
                  </div>
                ))}
                {totalLpHolders > 5 && (
                  <div className="text-xs text-muted-foreground">
                    ...and {totalLpHolders - 5} more holders
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Security Info */}
          {securityRawData && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Honeypot:</span>
                <span className={securityRawData.is_honeypot === '1' ? 'text-red-600' : 'text-green-600'}>
                  {securityRawData.is_honeypot === '1' ? 'Yes ⚠️' : 'No ✓'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mintable:</span>
                <span className={securityRawData.is_mintable === '1' ? 'text-yellow-600' : 'text-green-600'}>
                  {securityRawData.is_mintable === '1' ? 'Yes' : 'No'}
                </span>
              </div>
              {securityRawData.buy_tax && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buy Tax:</span>
                  <span className={parseFloat(securityRawData.buy_tax) > 10 ? 'text-red-600' : ''}>
                    {securityRawData.buy_tax}%
                  </span>
                </div>
              )}
              {securityRawData.sell_tax && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sell Tax:</span>
                  <span className={parseFloat(securityRawData.sell_tax) > 10 ? 'text-red-600' : ''}>
                    {securityRawData.sell_tax}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Last Checked */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last checked:</span>
              <span>{formatDate(securityCheckedAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}