'use client';

import { useState } from 'react';
import { MessagingLayout } from '@/components/messaging/core/messaging-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Zap, Shield, Smartphone } from 'lucide-react';

export default function ModernMessagingPage() {
  const [showDemo, setShowDemo] = useState(false);

  const handleSendMessage = (conversationId: string, content: string, attachments?: File[]) => {
    console.log('Sending message:', { conversationId, content, attachments });
    // Here you would integrate with your real messaging backend
  };

  const handleCreateGroup = () => {
    console.log('Creating new group...');
    // Here you would show a group creation dialog
  };

  if (showDemo) {
    return (
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b bg-background flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">SECL Messaging Platform</h1>
            <p className="text-sm text-muted-foreground">Modern team communication</p>
          </div>
          <Button variant="outline" onClick={() => setShowDemo(false)}>
            Back to Overview
          </Button>
        </div>
        <div className="flex-1">
          <MessagingLayout
            currentUserId="ADMIN001"
            currentUserName="System Admin"
            onSendMessage={handleSendMessage}
            onCreateGroup={handleCreateGroup}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            🚀 Now Available
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            SECL Messaging Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect, collaborate, and communicate with your team using our modern, 
            WhatsApp-inspired messaging platform built specifically for SECL employees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setShowDemo(true)} className="text-lg px-8">
              <MessageCircle className="mr-2 h-5 w-5" />
              Try Live Demo
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<MessageCircle className="h-8 w-8 text-blue-500" />}
            title="Real-time Messaging"
            description="Instant messaging with delivery receipts, typing indicators, and read status - just like WhatsApp."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8 text-green-500" />}
            title="Group Conversations"
            description="Create department groups, project teams, or cross-functional collaboration spaces."
          />
          <FeatureCard
            icon={<Smartphone className="h-8 w-8 text-purple-500" />}
            title="Progressive Web App"
            description="Works seamlessly on desktop and mobile. Install it like a native app."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-500" />}
            title="Offline Support"
            description="Send messages even when offline. They'll be delivered when connection returns."
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-red-500" />}
            title="Secure & Private"
            description="Built for enterprise with role-based access and secure employee authentication."
          />
          <FeatureCard
            icon={<MessageCircle className="h-8 w-8 text-indigo-500" />}
            title="Rich Content"
            description="Share files, images, emojis, and even voice messages with your team."
          />
        </div>

        {/* Preview Section */}
        <Card className="mb-16 overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Modern Interface</CardTitle>
            <p className="text-muted-foreground">
              Familiar WhatsApp-style design that your team will love
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white text-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Smart Conversations</h3>
                  <p className="text-sm opacity-90">Organized by department, project, or custom groups</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Lightning Fast</h3>
                  <p className="text-sm opacity-90">Instant message delivery with real-time updates</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full mx-auto flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">Enterprise Ready</h3>
                  <p className="text-sm opacity-90">Secure, scalable, and compliant with SECL standards</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Team Communication?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of workplace messaging. Try our interactive demo and see 
            how easy it is to stay connected with your team.
          </p>
          <Button size="lg" onClick={() => setShowDemo(true)} className="text-lg px-12 py-4">
            <MessageCircle className="mr-2 h-6 w-6" />
            Launch Interactive Demo
          </Button>
        </div>

        {/* Implementation Status */}
        <Card className="mt-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Phase 1 Complete</Badge>
              Implementation Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-green-600 mb-2">✅ Completed Features</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Core messaging UI with shadcn/ui components</li>
                  <li>• Real-time conversation list</li>
                  <li>• Modern message bubbles with status indicators</li>
                  <li>• Emoji picker and file attachments</li>
                  <li>• Responsive mobile/desktop design</li>
                  <li>• Clean architecture with domain entities</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-600 mb-2">🚧 Next Steps (Phase 2)</h4>
                <ul className="space-y-1 text-sm">
                  <li>• WebSocket real-time messaging integration</li>
                  <li>• Employee directory group creation</li>
                  <li>• Push notifications for PWA</li>
                  <li>• Message search and filtering</li>
                  <li>• Voice message recording</li>
                  <li>• Advanced message reactions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
}) {
  return (
    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105">
      <CardContent className="p-6 text-center">
        <div className="mb-4 flex justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
} 