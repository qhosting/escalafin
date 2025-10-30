
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Leer archivo de versión
    const versionPath = join(process.cwd(), 'version.json')
    const versionData = await readFile(versionPath, 'utf-8')
    const versionInfo = JSON.parse(versionData)

    // Agregar información adicional
    const response = {
      ...versionInfo,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error reading version:', error)
    
    // Fallback a package.json
    try {
      const packagePath = join(process.cwd(), 'package.json')
      const packageData = await readFile(packagePath, 'utf-8')
      const packageInfo = JSON.parse(packageData)
      
      return NextResponse.json({
        version: packageInfo.version || '1.0.0',
        error: 'version.json not found, using package.json',
        timestamp: new Date().toISOString()
      })
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          version: 'unknown',
          error: 'Could not determine version',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
  }
}
