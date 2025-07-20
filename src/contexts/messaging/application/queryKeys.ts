export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: () => [...messagingKeys.all, "conversations"] as const,
  conversation: (id: string) => [...messagingKeys.conversations(), id] as const,
  messages: (conversationId: string) =>
    [...messagingKeys.conversation(conversationId), "messages"] as const,
} as const;