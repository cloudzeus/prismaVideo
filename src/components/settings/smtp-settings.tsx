"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Mail, Server, Shield, TestTube, Save, RefreshCw } from 'lucide-react'

interface SmtpSettings {
  host: string
  port: number
  username: string
  password: string
  encryption: 'tls' | 'ssl' | 'none'
  fromEmail: string
  fromName: string
  enabled: boolean
  requireAuth: boolean
  timeout: number
}

const defaultSettings: SmtpSettings = {
  host: '',
  port: 587,
  username: '',
  password: '',
  encryption: 'tls',
  fromEmail: '',
  fromName: '',
  enabled: false,
  requireAuth: true,
  timeout: 30,
}

export function SmtpSettings() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<SmtpSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/settings/smtp')
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // If no settings found, use defaults
        setSettings(defaultSettings)
      }
    } catch (error) {
      console.error('Error loading SMTP settings:', error)
      toast({
        title: "Error",
        description: "Failed to load SMTP settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch('/api/settings/smtp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save SMTP settings')
      }

      toast({
        title: "Success",
        description: "SMTP settings saved successfully",
      })
    } catch (error) {
      console.error('Error saving SMTP settings:', error)
      toast({
        title: "Error",
        description: "Failed to save SMTP settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const [testEmail, setTestEmail] = useState('')

  const handleTest = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsTesting(true)
      setTestResult(null)
      
      const response = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      })

      const result = await response.json()
      
      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Test email sent successfully! Check your inbox.',
        })
        toast({
          title: "Success",
          description: "Test email sent successfully",
        })
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Failed to send test email',
        })
        toast({
          title: "Error",
          description: "Failed to send test email",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error testing SMTP settings:', error)
      setTestResult({
        success: false,
        message: 'Connection failed. Please check your settings.',
      })
      toast({
        title: "Error",
        description: "Failed to test SMTP connection",
        variant: "destructive",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setTestResult(null)
  }

  const updateSetting = (key: keyof SmtpSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>SMTP Status</span>
          </CardTitle>
          <CardDescription>
            Current email server configuration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {settings.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                {settings.enabled ? 'Active' : 'Inactive'}
              </Badge>
              {settings.encryption !== 'none' && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{settings.encryption.toUpperCase()}</span>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Server Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your SMTP server connection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">SMTP Host</Label>
              <Input
                id="host"
                value={settings.host}
                onChange={(e) => updateSetting('host', e.target.value)}
                placeholder="smtp.gmail.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={settings.port}
                onChange={(e) => updateSetting('port', parseInt(e.target.value))}
                placeholder="587"
                min="1"
                max="65535"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="encryption">Encryption</Label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="encryption"
                  value="tls"
                  checked={settings.encryption === 'tls'}
                  onChange={(e) => updateSetting('encryption', e.target.value)}
                  className="w-4 h-4"
                />
                <span>TLS (Recommended)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="encryption"
                  value="ssl"
                  checked={settings.encryption === 'ssl'}
                  onChange={(e) => updateSetting('encryption', e.target.value)}
                  className="w-4 h-4"
                />
                <span>SSL</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="encryption"
                  value="none"
                  checked={settings.encryption === 'none'}
                  onChange={(e) => updateSetting('encryption', e.target.value)}
                  className="w-4 h-4"
                />
                <span>None</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout">Connection Timeout (seconds)</Label>
            <Input
              id="timeout"
              type="number"
              value={settings.timeout}
              onChange={(e) => updateSetting('timeout', parseInt(e.target.value))}
              placeholder="30"
              min="5"
              max="300"
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>
            Configure SMTP authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Require Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Enable if your SMTP server requires username and password
              </p>
            </div>
            <Switch
              checked={settings.requireAuth}
              onCheckedChange={(checked) => updateSetting('requireAuth', checked)}
            />
          </div>

          {settings.requireAuth && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={settings.username}
                  onChange={(e) => updateSetting('username', e.target.value)}
                  placeholder="your-email@domain.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={settings.password}
                  onChange={(e) => updateSetting('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sender Information */}
      <Card>
        <CardHeader>
          <CardTitle>Sender Information</CardTitle>
          <CardDescription>
            Configure the default sender for outgoing emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={settings.fromEmail}
                onChange={(e) => updateSetting('fromEmail', e.target.value)}
                placeholder="noreply@yourcompany.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={settings.fromName}
                onChange={(e) => updateSetting('fromName', e.target.value)}
                placeholder="Your Company Name"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test Connection</span>
          </CardTitle>
          <CardDescription>
            Test your SMTP configuration by sending a test email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter an email address to send a test email and verify your SMTP configuration
            </p>
          </div>

          <Button
            onClick={handleTest}
            disabled={isTesting || !testEmail}
            className="flex items-center space-x-2"
          >
            <TestTube className="h-4 w-4" />
            <span>{isTesting ? 'Testing...' : 'Send Test Email'}</span>
          </Button>

          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {testResult.success ? (
                  <TestTube className="h-4 w-4 text-green-600" />
                ) : (
                  <TestTube className="h-4 w-4 text-red-600" />
                )}
                <span className="font-medium">{testResult.message}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Save your configuration or reset to defaults
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSetting('enabled', checked)}
              />
              <Label>Enable SMTP</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reset</span>
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 