import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ params: string[] }> }
) {
  const { params } = await context
  const [width, height] = params.params
  const url = new URL(request.url)
  const text = url.searchParams.get('text') || ''

  const w = parseInt(width) || 200
  const h = parseInt(height) || 150

  // Generate a simple SVG placeholder
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui" font-size="14" fill="#9ca3af">
        ${text || `${w}x${h}`}
      </text>
    </svg>
  `

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
