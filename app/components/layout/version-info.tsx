
'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

interface VersionInfo {
  version: string
  buildNumber?: string
  releaseDate?: string
  releaseName?: string
  gitCommit?: string
  environment?: string
  timestamp?: string
}

export function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVersionInfo()
  }, [])

  const fetchVersionInfo = async () => {
    try {
      const response = await fetch('/api/system/version')
      if (response.ok) {
        const data = await response.json()
        setVersionInfo(data)
      }
    } catch (error) {
      console.error('Error fetching version info:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !versionInfo) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              v{versionInfo.version}
            </Badge>
            <Info className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div>
              <p className="font-semibold">
                EscalaFin MVP v{versionInfo.version}
              </p>
              {versionInfo.releaseName && (
                <p className="text-xs text-muted-foreground">
                  {versionInfo.releaseName}
                </p>
              )}
            </div>
            
            {versionInfo.buildNumber && (
              <div>
                <p className="text-xs">
                  <span className="font-medium">Build:</span>{' '}
                  {versionInfo.buildNumber}
                </p>
              </div>
            )}
            
            {versionInfo.gitCommit && (
              <div>
                <p className="text-xs font-mono">
                  <span className="font-medium">Commit:</span>{' '}
                  {versionInfo.gitCommit}
                </p>
              </div>
            )}
            
            {versionInfo.releaseDate && (
              <div>
                <p className="text-xs">
                  <span className="font-medium">Fecha:</span>{' '}
                  {versionInfo.releaseDate}
                </p>
              </div>
            )}
            
            {versionInfo.environment && (
              <div>
                <Badge 
                  variant={versionInfo.environment === 'production' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {versionInfo.environment}
                </Badge>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
