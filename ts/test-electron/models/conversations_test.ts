// Copyright 2014-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { assert } from 'chai';

describe('Conversations', () => {
  async function resetConversationController(): Promise<void> {
    window.ConversationController.reset();
    await window.ConversationController.load();
  }

  beforeEach(resetConversationController);

  afterEach(resetConversationController);

  it('updates lastMessage even in race conditions with db', async () => {
    const ourNumber = '+15550000000';
    const ourUuid = window.getGuid();

    // Creating a fake conversation
    const conversation = new window.Whisper.Conversation({
      id: '8c45efca-67a4-4026-b990-9537d5d1a08f',
      e164: '+15551234567',
      uuid: '2f2734aa-f69d-4c1c-98eb-50eb0fc512d7',
      type: 'private',
      inbox_position: 0,
      isPinned: false,
      markedUnread: false,
      lastMessageDeletedForEveryone: false,
      messageCount: 0,
      sentMessageCount: 0,
      profileSharing: true,
      version: 0,
    });

    const destinationE164 = '+15557654321';
    window.textsecure.storage.user.setNumberAndDeviceId(
      ourNumber,
      2,
      'my device'
    );
    window.textsecure.storage.user.setUuidAndDeviceId(ourUuid, 2);
    await window.ConversationController.loadPromise();

    // Creating a fake message
    const now = Date.now();
    let message = new window.Whisper.Message({
      attachments: [],
      body: 'bananas',
      conversationId: conversation.id,
      delivered: 1,
      delivered_to: [destinationE164],
      destination: destinationE164,
      expirationStartTimestamp: now,
      hasAttachments: false,
      hasFileAttachments: false,
      hasVisualMediaAttachments: false,
      id: 'd8f2b435-e2ef-46e0-8481-07e68af251c6',
      received_at: now,
      recipients: [destinationE164],
      sent: true,
      sent_at: now,
      sent_to: [destinationE164],
      timestamp: now,
      type: 'outgoing',
    });

    // Saving to db and updating the convo's last message
    await window.Signal.Data.saveMessage(message.attributes, {
      forceSave: true,
    });
    message = window.MessageController.register(message.id, message);
    await window.Signal.Data.saveConversation(conversation.attributes);
    await conversation.updateLastMessage();

    // Should be set to bananas because that's the last message sent.
    assert.strictEqual(conversation.get('lastMessage'), 'bananas');

    // Erasing message contents (DOE)
    message.set({
      isErased: true,
      body: '',
      bodyRanges: undefined,
      attachments: [],
      quote: undefined,
      contact: [],
      sticker: undefined,
      preview: [],
    });

    // Not saving the message to db on purpose
    // to simulate that a save hasn't taken place yet.

    // Updating convo's last message, should pick it up from memory
    await conversation.updateLastMessage();

    assert.strictEqual(conversation.get('lastMessage'), '');
  });
});
