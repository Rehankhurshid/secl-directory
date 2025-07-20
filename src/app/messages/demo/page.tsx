'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function MessagesDemoPage() {
  const { employee, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [demoStarted, setDemoStarted] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/messages/demo');
    }
  }, [isAuthenticated, isLoading, router]);

  const startDemo = async () => {
    if (!employee) return;
    
    setIsCreating(true);
    setDemoStarted(true);
    
    try {
      // Create demo conversation
      const response = await fetch('/api/conversations/create-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`,
        },
        body: JSON.stringify({ userId: employee.empCode }),
      });

      if (!response.ok) throw new Error('Failed to create demo');
      
      const data = await response.json();
      
      // Open conversation in new tab
      window.open(`/messages/${data.conversationId}`, '_blank');
      
      // Simulate other employee sending messages
      setTimeout(() => {
        simulateOtherEmployeeMessages(data.conversationId);
      }, 5000);
      
    } catch (error) {
      console.error('Error starting demo:', error);
      setIsCreating(false);
      setDemoStarted(false);
    }
  };

  const simulateOtherEmployeeMessages = async (conversationId: string) => {
    const messages = [
      { senderId: 'EMP002', content: 'I just tested sending a message!', delay: 2000 },
      { senderId: 'EMP001', content: 'Great! Do you see this in real-time?', delay: 5000 },
      { senderId: 'EMP002', content: 'Yes! It appears within 10 seconds thanks to polling.', delay: 8000 },
      { senderId: 'EMP001', content: 'Phase 3 will have instant WebSocket updates! 🚀', delay: 12000 },
    ];

    for (const msg of messages) {
      setTimeout(async () => {
        await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversationId,
            senderId: msg.senderId,
            content: msg.content,
          }),
        });
      }, msg.delay);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-8">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Real-time Messaging Demo</h1>
          <p className="text-muted-foreground">
            Experience a simulated conversation between multiple employees
          </p>
        </div>

        {!demoStarted ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">What will happen:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>A new conversation will be created with 3 participants</li>
                <li>The conversation will open in a new tab</li>
                <li>You'll see messages from other employees appear automatically</li>
                <li>Messages sync every 10 seconds (Phase 2 polling)</li>
                <li>You can also send your own messages</li>
              </ul>
            </div>

            <Button 
              onClick={startDemo} 
              size="lg"
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Demo...
                </>
              ) : (
                'Start Real-time Demo'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <p className="text-green-800 dark:text-green-200">
                ✅ Demo started! Check the new tab to see the conversation.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>💡 Try these actions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Send a message and see it appear instantly</li>
                <li>Watch for automated messages from other employees</li>
                <li>Open the same conversation in another browser/incognito</li>
                <li>Send messages from both windows</li>
              </ul>
            </div>
            <Button 
              onClick={() => router.push('/messages')}
              variant="outline"
              className="w-full"
            >
              Go to Messages
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}