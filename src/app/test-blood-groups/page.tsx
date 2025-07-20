'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestBloodGroups() {
  const [debugData, setDebugData] = useState<any>(null)
  const [statsData, setStatsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch debug data
        const debugRes = await fetch('/api/debug/blood-groups')
        const debug = await debugRes.json()
        setDebugData(debug)

        // Fetch stats data
        const statsRes = await fetch('/api/employees/stats')
        const stats = await statsRes.json()
        setStatsData(stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Blood Group Debug Information</h1>

      <Card>
        <CardHeader>
          <CardTitle>Database Blood Group Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Total Active Employees:</strong> {debugData?.totalActiveEmployees}
            </div>
            <div>
              <strong>Blood Group Distribution:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto">
                {JSON.stringify(debugData?.bloodGroupStats, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Sample Employees by Blood Group:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto">
                {JSON.stringify(debugData?.samplesByBloodGroup, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Debug Info:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto">
                {JSON.stringify(debugData?.debug, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Stats Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Blood Groups from Stats API:</strong>
              <pre className="mt-2 p-4 bg-gray-100 rounded overflow-x-auto">
                {JSON.stringify(statsData?.bloodGroups, null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statsData?.bloodGroups?.map((bg: any, index: number) => (
              <div key={index} className="flex justify-between p-2 border rounded">
                <span>{bg.name}</span>
                <span className="font-mono">Count: {bg.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}