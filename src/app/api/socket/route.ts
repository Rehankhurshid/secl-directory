import { NextRequest } from 'next/server'
import { createServer } from 'http'
import { initializeSocketServer } from '@/lib/socket/server'

export const dynamic = 'force-dynamic'

let httpServer: any = null
let io: any = null

export async function GET(req: NextRequest) {
  if (!httpServer) {
    const port = parseInt(process.env.SOCKET_PORT || '3001')
    
    httpServer = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('Socket.IO server is running')
    })

    io = initializeSocketServer(httpServer)

    httpServer.listen(port, () => {
      console.log(`Socket.IO server listening on port ${port}`)
    })
  }

  return new Response('Socket.IO server initialized', { status: 200 })
}