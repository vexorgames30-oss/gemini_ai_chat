export default async (req) => {
  try {
    const formData = await req.formData();
    const message = formData.get('message') || '';
    const historyRaw = formData.get('history') || '[]';
    const image = formData.get('image');
    const history = JSON.parse(historyRaw);

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response('⚠️ API Key not configured', { status: 500 });
    }

    const contents = history.map(h => ({
      role: h.role === 'assistant'? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const parts = [{ text: message }];

    if (image) {
      const buffer = await image.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      parts.push({
        inline_data: {
          mime_type: image.type,
          data: base64
        }
      });
    }

    contents.push({ role: 'user', parts });

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!geminiRes.ok) {
      const error = await geminiRes.text();
      return new Response(`Gemini API Error: ${error}`, { status: 500 });
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    return new Response(reply, {
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (e) {
    return new Response(`Server Error: ${e.message}`, { status: 500 });
  }
};
