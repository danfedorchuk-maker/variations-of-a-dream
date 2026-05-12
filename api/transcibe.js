// api/transcribe.js — Variations of a Dream
// Transcribes voice recording using Groq Whisper

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(200).json({ error: 'GROQ_API_KEY missing' });

  try {
    // Get raw body as buffer
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks);

    // Parse multipart — find the audio data
    const boundary = req.headers['content-type'].split('boundary=')[1];
    if (!boundary) return res.status(400).json({ error: 'No boundary found' });

    const boundaryBuf = Buffer.from('--' + boundary);
    let start = body.indexOf(boundaryBuf) + boundaryBuf.length;

    // Skip headers to find audio data
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), start) + 4;
    const nextBoundary = body.indexOf(boundaryBuf, headerEnd);
    const audioData = body.slice(headerEnd, nextBoundary - 2); // trim \r\n

    // Send to Groq Whisper
    const formData = new FormData();
    const blob = new Blob([audioData], { type: 'audio/webm' });
    formData.append('file', blob, 'dream.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    });

    const data = await response.json();
    if (data.text) {
      return res.status(200).json({ text: data.text });
    } else {
      return res.status(200).json({ error: 'Transcription failed', details: data });
    }
  } catch (err) {
    return res.status(200).json({ error: err.message });
  }
};

module.exports = handler;
