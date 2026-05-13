// api/transcribe.js — Variations of a Dream
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY missing' });

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error: ' + err.message });

    const file = files.file?.[0] || files.audio?.[0];
    if (!file) return res.status(400).json({ error: 'No audio file received' });

    try {
      const audioBuffer = fs.readFileSync(file.filepath);
      const blob = new Blob([audioBuffer], { type: 'audio/webm' });

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
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}
