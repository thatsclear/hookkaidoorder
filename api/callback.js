export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = process.env.TELEGRAM_TOKEN;
  const { callback_query } = req.body;

  if (!callback_query) return res.status(200).json({ ok: true });

  const { id, data, from, message } = callback_query;

  if (data !== 'accepted') {
    await answerCallback(token, id);
    return res.status(200).json({ ok: true });
  }

  const firstName = from.first_name || '';
  const lastName = from.last_name || '';
  const name = [firstName, lastName].filter(Boolean).join(' ');

  const orderTime = message.date;
  const acceptTime = Math.floor(Date.now() / 1000);
  const diffSeconds = acceptTime - orderTime;
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  const reactionTime = minutes > 0
    ? `${minutes} min ${seconds} s`
    : `${seconds} s`;

  const originalText = message.text || '';
  const updatedText = originalText + `\n\n✅ Přijato: ${name} (${reactionTime})`;

  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: message.chat.id,
      message_id: message.message_id,
      text: updatedText,
      reply_markup: { inline_keyboard: [] },
    }),
  });

  await answerCallback(token, id);
  return res.status(200).json({ ok: true });
}

async function answerCallback(token, callbackQueryId) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  });
}
