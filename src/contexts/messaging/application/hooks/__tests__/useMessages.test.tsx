import { renderHook, waitFor } from '@testing-library/react';
import { useMessages } from '../useMessages';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock the API
jest.mock('../../infrastructure/api/messagingApi', () => ({
  MessagingApi: jest.fn().mockImplementation(() => ({
    getMessages: jest.fn().mockResolvedValue([
      {
        id: '1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
        type: 'text',
        createdAt: new Date(),
      }
    ]),
    sendMessage: jest.fn().mockResolvedValue({
      id: '2',
      conversationId: 'conv-1',
      senderId: 'user-1',
      content: 'New message',
      type: 'text',
      createdAt: new Date(),
    }),
  })),
}));

describe('useMessages', () => {
  it('should fetch messages', async () => {
    const { result } = renderHook(() => useMessages('conv-1', 'user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.messages).toBeDefined();
    expect(result.current.messages.length).toBeGreaterThan(0);
  });

  it('should handle send message', async () => {
    const { result } = renderHook(() => useMessages('conv-1', 'user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCount = result.current.messages.length;

    // Send a message
    result.current.sendMessage('Hello world');

    // Should immediately add message (optimistic update)
    expect(result.current.messages.length).toBe(initialCount + 1);
  });
});