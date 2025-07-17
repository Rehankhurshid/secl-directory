import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Database, 
  Bell, 
  Shield, 
  Server,
  Users,
  MessageSquare,
  Clock,
  Save,
  RefreshCw
} from 'lucide-react';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'SECL Employee Directory',
    systemDescription: 'Progressive Web Application for employee directory management',
    maxSessionDuration: 7, // days
    otpExpiryMinutes: 5,
    
    // Authentication Settings
    enableOtpAuth: true,
    allowSelfRegistration: false,
    requirePhoneVerification: true,
    
    // Messaging Settings
    enableGroupMessaging: true,
    enablePushNotifications: true,
    maxGroupSize: 100,
    
    // Performance Settings
    employeesPerPage: 20,
    enableCaching: true,
    cacheExpiryMinutes: 5,
    
    // Security Settings
    enableRateLimit: true,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // TODO: Implement settings save
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Configure system behavior and preferences
          </p>
        </div>
        <Button onClick={handleSaveSettings} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => handleSettingChange('systemName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="systemDescription">System Description</Label>
              <Input
                id="systemDescription"
                value={settings.systemDescription}
                onChange={(e) => handleSettingChange('systemDescription', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employeesPerPage">Employees Per Page</Label>
              <Input
                id="employeesPerPage"
                type="number"
                value={settings.employeesPerPage}
                onChange={(e) => handleSettingChange('employeesPerPage', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentication Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>OTP Authentication</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enable SMS-based OTP authentication
                </p>
              </div>
              <Switch
                checked={settings.enableOtpAuth}
                onCheckedChange={(checked) => handleSettingChange('enableOtpAuth', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Phone Verification</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Require phone number verification
                </p>
              </div>
              <Switch
                checked={settings.requirePhoneVerification}
                onCheckedChange={(checked) => handleSettingChange('requirePhoneVerification', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSessionDuration">Session Duration (days)</Label>
              <Input
                id="maxSessionDuration"
                type="number"
                value={settings.maxSessionDuration}
                onChange={(e) => handleSettingChange('maxSessionDuration', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otpExpiryMinutes">OTP Expiry (minutes)</Label>
              <Input
                id="otpExpiryMinutes"
                type="number"
                value={settings.otpExpiryMinutes}
                onChange={(e) => handleSettingChange('otpExpiryMinutes', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Messaging Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Messaging
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Group Messaging</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enable group messaging features
                </p>
              </div>
              <Switch
                checked={settings.enableGroupMessaging}
                onCheckedChange={(checked) => handleSettingChange('enableGroupMessaging', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enable push notifications
                </p>
              </div>
              <Switch
                checked={settings.enablePushNotifications}
                onCheckedChange={(checked) => handleSettingChange('enablePushNotifications', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGroupSize">Max Group Size</Label>
              <Input
                id="maxGroupSize"
                type="number"
                value={settings.maxGroupSize}
                onChange={(e) => handleSettingChange('maxGroupSize', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Caching</Label>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Enable response caching
                </p>
              </div>
              <Switch
                checked={settings.enableCaching}
                onCheckedChange={(checked) => handleSettingChange('enableCaching', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cacheExpiryMinutes">Cache Expiry (minutes)</Label>
              <Input
                id="cacheExpiryMinutes"
                type="number"
                value={settings.cacheExpiryMinutes}
                onChange={(e) => handleSettingChange('cacheExpiryMinutes', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Sessions</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}