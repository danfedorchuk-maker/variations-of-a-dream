// api/transcribe.js — Variations of a Dream
const formidable = require('formidable');
const fs = require('fs');

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY missing' });

  try {
    const form = formidable({ maxFileSize: 25 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const audioFile = files.audio?.[0];
    if (!audioFile) return res.status(400).json({ error: 'No audio file received' });

    const audioData = fs.readFileSync(audioFile.filepath);
    const blob = new Blob([audioData], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', blob, 'dream.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await response.json();
    if (data.text) return res.status(200).json({ text: data.text });
    return res.status(500).json({ error: 'Transcription failed', details: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = handler;
