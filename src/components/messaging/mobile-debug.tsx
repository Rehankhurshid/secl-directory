"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import wsManager from '@/lib/websocket/websocket-manager';

export default function MobileDebug() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [networkInfo, setNetworkInfo] = useState({
    hostname: '',
    port: '',
    protocol: '',
    userAgent: '',
    isOnline: navigator.onLine
  });
  const [wsUrl, setWsUrl] = useState('');
  const [connectionLog, setConnectionLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  useEffect(() => {
    // Gather network information
    setNetworkInfo({
      hostname: window.location.hostname,
      port: window.location.port || '3000',
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine
    });

    // Get WebSocket URL that would be used
    const testWsManager = new (wsManager.constructor as any)();
    setWsUrl(testWsManager.url || 'Unknown');

    // Listen to connection status changes
    const handleStatusChange = (status: string) => {
      setConnectionStatus(status);
      addLog(`Status changed: ${status}`);
    };

    wsManager.on('statusChange', handleStatusChange);

    // Test connection on mount
    addLog('Component mounted, starting connection test...');

    return () => {
      wsManager.off('statusChange', handleStatusChange);
    };
  }, []);

  const testConnection = async () => {
    addLog('Testing WebSocket connection...');
    try {
      await wsManager.connect('mobile-debug-user');
      addLog('Connection attempt initiated');
    } catch (error) {
      addLog(`Connection error: ${error}`);
    }
  };

  const disconnect = () => {
    wsManager.disconnect();
    addLog('Disconnected manually');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Mobile WebSocket Debug
            <Badge className={getStatusColor(connectionStatus)}>
              {connectionStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="font-semibold">Network Information</h3>
              <div className="text-sm space-y-1">
                <p><strong>Hostname:</strong> {networkInfo.hostname}</p>
                <p><strong>Port:</strong> {networkInfo.port}</p>
                <p><strong>Protocol:</strong> {networkInfo.protocol}</p>
                <p><strong>Online:</strong> {networkInfo.isOnline ? '✅' : '❌'}</p>
                <p><strong>User Agent:</strong> {networkInfo.userAgent.includes('Mobile') ? '📱 Mobile' : '🖥️ Desktop'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold">WebSocket Configuration</h3>
              <div className="text-sm">
                <p><strong>WebSocket URL:</strong> {wsUrl}</p>
                <p><strong>Environment URL:</strong> {process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'Not set'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={testConnection} disabled={connectionStatus === 'connecting'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Test Connection'}
              </Button>
              <Button variant="outline" onClick={disconnect}>
                Disconnect
              </Button>
            </div>

            <div>
              <h3 className="font-semibold">Connection Log</h3>
              <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-48 overflow-y-auto">
                {connectionLog.length === 0 ? (
                  <p>No logs yet...</p>
                ) : (
                  connectionLog.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔧 Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>If connection fails on mobile:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure mobile is on same WiFi network as development machine</li>
              <li>Check if firewall is blocking port 3002</li>
              <li>Try accessing health check: <code>http://{networkInfo.hostname}:3002/health</code></li>
              <li>Verify WebSocket server is running: <code>npm run dev:mobile</code></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 