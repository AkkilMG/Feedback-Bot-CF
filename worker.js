// ---------- Configuration ---------- //

const BOT_TOKEN = '1234567890:ABCDEfghijklmno-PQrstuvwxYZ'; // Your Bot's Token (from BotFather)
const BOT_WEBHOOK = '/endpoint'; // Path for Telegram updates
const BOT_SECRET = 'akkil123456'; // Secret for webhook verification
const LOG_CHANNEL = '-1234567890'; // Channel ID for logs
const OWNER_ID = 1428968542; // Your Telegram User ID (Admin)

// ---------- Constants & Helpers ---------- //

const IF_TEXT = "Reference ID: {}\nFrom: {}\n\n{}";
const IF_CONTENT = "Reference ID: {}\nFrom: {}";

const HEADERS_JSON = { 'Content-Type': 'application/json' };

// ---------- Database (using KV Store) ---------- //

/**
 * @param {string} userId
 */
async function isUserExist(userId) {
  // Replace 'FEEDBACK' with your KV namespace binding name
  return await FEEDBACK.get(`user:${userId}`) !== null;
}

/**
 * @param {string} userId
 */
async function addUser(userId) {
  // Replace 'FEEDBACK' with your KV namespace binding name
  await FEEDBACK.put(`user:${userId}`, JSON.stringify({ created_at: Date.now() }));
}

/**
 * @param {string} userId
 */
async function getBanStatus(userId) {
  // Replace 'FEEDBACK' with your KV namespace binding name
  const data = await FEEDBACK.get(`ban:${userId}`);
  if (data) {
    return JSON.parse(data);
  }
  return { is_banned: false, ban_duration: 0, ban_reason: '' };
}

/**
 * @param {string} userId
 * @param {number} banDuration
 * @param {string} banReason
 */
async function setBanStatus(userId, banDuration, banReason) {
  // Replace 'FEEDBACK' with your KV namespace binding name
  await FEEDBACK.put(`ban:${userId}`, JSON.stringify({
    is_banned: true,
    ban_duration: banDuration,
    ban_reason: banReason
  }));
}

// ---------- Telegram API Functions ---------- //

/**
 * @param {string} method
 * @param {object} [params]
 */
async function api(method, params) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const response = await fetch(params ? `${url}?${new URLSearchParams(params)}` : url, {
    method: params ? 'POST' : 'GET',
    headers: params ? { 'Content-Type': 'application/json' } : undefined,
    body: params ? JSON.stringify(params) : undefined
  });

  return response.json();
}

async function getMe() {
  return api('getMe');
}

async function sendMessage(chat_id, text, reply_to_message_id = null) {
  return api('sendMessage', { chat_id, text, reply_to_message_id, parse_mode: 'Markdown' });
}

async function copyMessage(chat_id, from_chat_id, message_id, caption = null) {
  return api('copyMessage', { chat_id, from_chat_id, message_id, caption, parse_mode: 'Markdown' });
}

async function copyMediaGroup(chat_id, from_chat_id, message_id) {
  return api('copyMessage', { chat_id, from_chat_id, message_id });
}

async function sendPhoto(chatId, photo, caption = null, replyToMessageId = null) {
    return api("sendPhoto", {
      chat_id: chatId,
      photo: photo,
      caption: caption,
      parse_mode: "Markdown",
      reply_to_message_id: replyToMessageId,
    });
  }
  
  async function sendVideo(chatId, video, caption = null, replyToMessageId = null) {
    return api("sendVideo", {
      chat_id: chatId,
      video: video,
      caption: caption,
      parse_mode: "Markdown",
      reply_to_message_id: replyToMessageId,
    });
  }
  
  async function sendAudio(chatId, audio, caption = null, replyToMessageId = null) {
    return api("sendAudio", {
      chat_id: chatId,
      audio: audio,
      caption: caption,
      parse_mode: "Markdown",
      reply_to_message_id: replyToMessageId,
    });
  }
  
  async function sendDocument(chatId, document, caption = null, replyToMessageId = null) {
    return api("sendDocument", {
      chat_id: chatId,
      document: document,
      caption: caption,
      parse_mode: "Markdown",
      reply_to_message_id: replyToMessageId,
    });
  }
  
  async function sendSticker(chatId, sticker, replyToMessageId = null) {
    return api("sendSticker", {
      chat_id: chatId,
      sticker: sticker,
      reply_to_message_id: replyToMessageId,
    });
  }

async function getUsers(user_ids) {
  const response = await api("getChat", { chat_id: user_ids });

  if (response.ok) {
    return response.result;
  } else {
    console.error("Error getting user info:", response);
    return null;
  }
}

// ---------- Webhook Handling ---------- //

async function handleWebhook(request) {
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== BOT_SECRET) {
    return new Response('Unauthorized', { status: 403 });
  }

  const update = await request.json();
  await onUpdate(update);
  return new Response('OK');
}

async function registerWebhook(request) {
  const url = new URL(request.url);
  const webhookUrl = `${url.protocol}//${url.hostname}${BOT_WEBHOOK}`;
  const response = await api('setWebhook', {
    url: webhookUrl,
    secret_token: BOT_SECRET
  });

  return new Response(JSON.stringify(response), { headers: HEADERS_JSON });
}

async function unregisterWebhook() {
  const response = await api('setWebhook', { url: '' });
  return new Response(JSON.stringify(response), { headers: HEADERS_JSON });
}

// ---------- Update Handler ---------- //

async function onUpdate(update) {
  if (update.message) {
    await onMessage(update.message);
  }
}

// ---------- Message Handler ---------- //

async function onMessage(message) {
  const chatId = message.from.id;
  const isGroup = message.chat.type === 'group' || message.chat.type === 'supergroup';

  // Database Check and User Add
  if (!(await isUserExist(chatId))) {
    const botInfo = await getMe();
    await addUser(chatId);
    await sendMessage(LOG_CHANNEL, `#NEWUSER: \n\nNew User [${message.from.first_name}](tg://user?id=${chatId}) started @${botInfo.username} !!`);
  }

  // Ban Check
  const banStatus = await getBanStatus(chatId);
  if (banStatus.is_banned) {
    await sendMessage(chatId, `You are Banned 🚫 to use this bot for **${banStatus.ban_duration}** day(s) for the reason _${banStatus.ban_reason}_ \n\n**Message from the admin 🤠**`);
    return;
  }

  if (message.text) {
    await handleTextMessage(message, isGroup);
  } else if (message.media_group_id && message.photo) {
      await handleMediaGroupMessage(message, isGroup);
  } else if (message.photo) {
    await handlePhotoMessage(message, isGroup);
  } else if (message.video) {
    await handleVideoMessage(message, isGroup);
  } else if (message.audio) {
    await handleAudioMessage(message, isGroup);
  } else if (message.document) {
    await handleDocumentMessage(message, isGroup);
  } else if (message.sticker) {
    await handleStickerMessage(message, isGroup);
  }
}

// ---------- Text Message Handler ---------- //

async function handleTextMessage(message, isGroup) {
  if (message.from.id === OWNER_ID) {
    await replyText(message);
    return;
  }
    const info = await getUsers(message.from.id);
    const referenceId = message.chat.id;
    await sendMessage(OWNER_ID, IF_TEXT.replace("{}", referenceId).replace("{}", info.first_name).replace("{}", message.text));
}

// ---------- Media Group Message Handler ---------- //

async function handleMediaGroupMessage(message, isGroup) {
  if (message.from.id === OWNER_ID) {
    await replayMedia(message);
    return;
  }

  const referenceId = message.chat.id;
  await copyMediaGroup(OWNER_ID, referenceId, message.message_id);
}

// ---------- Media Message Handlers ---------- //

async function handleMediaMessage(message, isGroup) {
  if (message.from.id === OWNER_ID) {
    await replayMedia(message);
    return;
  }

  const info = await getUsers(message.from.id);
  const referenceId = message.chat.id;
  let caption = IF_CONTENT.replace("{}", referenceId).replace("{}", info.first_name);

  if (message.caption) {
    caption += `\n\n${message.caption}`;
  }

  if (message.photo) {
    const fileId = message.photo[message.photo.length - 1].file_id;
    await sendPhoto(OWNER_ID, fileId, caption);
  } else if (message.video) {
    await sendVideo(OWNER_ID, message.video.file_id, caption);
  } else if (message.audio) {
    await sendAudio(OWNER_ID, message.audio.file_id, caption);
  } else if (message.document) {
    await sendDocument(OWNER_ID, message.document.file_id, caption);
  } else if (message.sticker) {
    await sendSticker(OWNER_ID, message.sticker.file_id);
  }
}

async function handlePhotoMessage(message, isGroup) {
    if (message.from.id === OWNER_ID) {
      await replayMedia(message);
      return;
    }
  
    const info = await getUsers(message.from.id);
    const referenceId = message.chat.id;
    let caption = IF_CONTENT.replace("{}", referenceId).replace("{}", info.first_name);
  
    if (message.caption) {
      caption += `\n\n${message.caption}`;
    }
  
    const fileId = message.photo[message.photo.length - 1].file_id;
    await sendPhoto(OWNER_ID, fileId, caption);
  }
  
  async function handleVideoMessage(message, isGroup) {
    if (message.from.id === OWNER_ID) {
      await replayMedia(message);
      return;
    }
  
    const info = await getUsers(message.from.id);
    const referenceId = message.chat.id;
    let caption = IF_CONTENT.replace("{}", referenceId).replace("{}", info.first_name);
  
    if (message.caption) {
      caption += `\n\n${message.caption}`;
    }
  
    await sendVideo(OWNER_ID, message.video.file_id, caption);
  }
  
  async function handleAudioMessage(message, isGroup) {
    if (message.from.id === OWNER_ID) {
      await replayMedia(message);
      return;
    }
  
    const info = await getUsers(message.from.id);
    const referenceId = message.chat.id;
    let caption = IF_CONTENT.replace("{}", referenceId).replace("{}", info.first_name);
  
    if (message.caption) {
      caption += `\n\n${message.caption}`;
    }
  
    await sendAudio(OWNER_ID, message.audio.file_id, caption);
  }
  
  async function handleDocumentMessage(message, isGroup) {
    if (message.from.id === OWNER_ID) {
      await replayMedia(message);
      return;
    }
  
    const info = await getUsers(message.from.id);
    const referenceId = message.chat.id;
    let caption = IF_CONTENT.replace("{}", referenceId).replace("{}", info.first_name);
  
    if (message.caption) {
      caption += `\n\n${message.caption}`;
    }
  
    await sendDocument(OWNER_ID, message.document.file_id, caption);
  }
  
  async function handleStickerMessage(message, isGroup) {
    if (message.from.id === OWNER_ID) {
      await replayMedia(message);
      return;
    }
  
    const info = await getUsers(message.from.id);
    const referenceId = message.chat.id;
    const caption = IF_CONTENT.replace("{}", referenceId).replace("{}", info.first_name);
  
    await sendSticker(OWNER_ID, message.sticker.file_id, caption);
  }

// ---------- Reply Handlers (for Owner) ---------- //

async function replyText(message) {
  if (!message.reply_to_message) return;

  const referenceId = getReferenceIdFromReply(message.reply_to_message);
  if (!referenceId) return;

  await sendMessage(referenceId, message.text);
}

async function replayMedia(message) {
    if (!message.reply_to_message) return;
  
    const referenceId = getReferenceIdFromReply(message.reply_to_message);
    if (!referenceId) return;
  
    if (message.media_group_id) {
      // Handle media group
      await copyMediaGroup(referenceId, message.chat.id, message.message_id);
    } else if (message.photo) {
        const fileId = message.photo[message.photo.length - 1].file_id;
        await sendPhoto(referenceId, fileId, message.caption, message.message_id);
    } else if (message.video) {
        await sendVideo(referenceId, message.video.file_id, message.caption, message.message_id);
    } else if (message.audio) {
        await sendAudio(referenceId, message.audio.file_id, message.caption, message.message_id);
    } else if (message.document) {
        await sendDocument(referenceId, message.document.file_id, message.caption, message.message_id);
    } else if (message.sticker) {
        await sendSticker(referenceId, message.sticker.file_id, message.message_id);
    }
  }

// ---------- Helper Function for Replies ---------- //

function getReferenceIdFromReply(replyToMessage) {
    let referenceId = null;
    if (replyToMessage.text) {
      const match = replyToMessage.text.match(/Reference ID: (\d+)/);
      if (match) {
        referenceId = parseInt(match[1]);
      }
    } else if (replyToMessage.caption) {
      const match = replyToMessage.caption.match(/Reference ID: (\d+)/);
      if (match) {
        referenceId = parseInt(match[1]);
      }
    }
    return referenceId;
  }

// ---------- Event Listener ---------- //

addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.pathname === BOT_WEBHOOK) {
    event.respondWith(handleWebhook(request));
  } else if (url.pathname === '/register') {
    event.respondWith(registerWebhook(request));
  } else if (url.pathname === '/unregister') {
    event.respondWith(unregisterWebhook());
  } else {
    event.respondWith(new Response('Not Found', { status: 404 }));
  }
});
