// api/speak.js — Variations of a Dream
// Text to speech via Google TTS

const handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  // Fallback: use browser speech synthesis signal if no Google key
  if (!apiKey) {
    return res.status(200).json({ error: 'No TTS key', fallback: true });
  }

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text.slice(0, 3000) },
          voice: {
            languageCode: 'en-GB',
            name: 'en-GB-Neural2-D',
            ssmlGender: 'MALE'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9,
            pitch: -2.0
          }
        })
      }
    );

    const data = await response.json();
    if (data.audioContent) {
      const audioBuffer = Buffer.from(data.audioContent, 'base64');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      return res.status(200).send(audioBuffer);
    } else {
      return res.status(200).json({ error: 'TTS failed', fallback: true });
    }
  } catch (err) {
    return res.status(200).json({ error: err.message, fallback: true });
  }
};

module.exports = handler;
