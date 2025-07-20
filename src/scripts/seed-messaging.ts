import { db } from '@/lib/db';
import { conversations, conversationParticipants, conversationMessages } from '@/lib/database/schema/messaging';
import { eq } from 'drizzle-orm';

async function seedMessaging() {
  console.log('🌱 Seeding messaging data...');

  try {
    // Create a test conversation
    const [testConversation] = await db
      .insert(conversations)
      .values({
        name: 'Test Conversation',
        type: 'group',
        createdBy: 'TEST001',
      })
      .returning();

    console.log('✅ Created test conversation:', testConversation.id);

    // Add participants
    await db.insert(conversationParticipants).values([
      {
        conversationId: testConversation.id,
        userId: 'TEST001',
        isAdmin: true,
      },
      {
        conversationId: testConversation.id,
        userId: 'TEST002',
        isAdmin: false,
      },
    ]);

    console.log('✅ Added participants');

    // Add some test messages
    await db.insert(conversationMessages).values([
      {
        conversationId: testConversation.id,
        senderId: 'TEST001',
        content: 'Hello everyone!',
        type: 'text',
      },
      {
        conversationId: testConversation.id,
        senderId: 'TEST002',
        content: 'Hi there! How are you?',
        type: 'text',
      },
      {
        conversationId: testConversation.id,
        senderId: 'TEST001',
        content: 'I am doing great, thanks for asking!',
        type: 'text',
      },
    ]);

    console.log('✅ Added test messages');

    // Update conversation lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, testConversation.id));

    console.log('✅ Messaging data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding messaging data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedMessaging()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}