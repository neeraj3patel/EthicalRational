const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY environment variable is not set!');
  console.error('Please set your Groq API key in the .env file');
  process.exit(1);
}

app.use(cors({
  origin: [
    'https://himanshu-biased-text-analyser-ai-frontend.vercel.app',
    'http://localhost:8080'
  ],
  credentials: true
}));

app.use(express.json());

app.post('/api/analyze-text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required.' });
  }

  const prompt = `
You are an expert bias detection system. For the following input, analyze it for bias and ethical issues.

Return ONLY a pure JSON object with this exact structure:
{
  "severity": "low|medium|high",
  "overallAssessment": "A brief and readable summary of your analysis.",
  "issues": [
    {
      "sentence": "Original sentence.",
      "bias": "Type of bias (e.g., socioeconomic, gender, age, etc.)",
      "issue": "Brief description of the issue.",
      "solution": "A more inclusive or neutral version of the sentence."
    }
  ]
}

Text to analyze: "${text}"

Do not include markdown, backticks, or any explanation — only return valid JSON.
`;

  try {
    console.log('Fetching from Groq API...');
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048
        })
      }
    );

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error Status:', groqResponse.status);
      console.error('Groq API Error Response:', errorText);
      return res.status(groqResponse.status).json({
        error: `Groq API Error: ${groqResponse.statusText}`,
        details: errorText
      });
    }

    const data = await groqResponse.json();
    console.log('Groq response received');
    
    let aiResult = data.choices?.[0]?.message?.content || '';
    
    if (!aiResult) {
      console.error('No content in Groq response:', data);
      return res.status(500).json({ error: 'No response content from Groq API' });
    }

    console.log('Raw AI result:', aiResult.substring(0, 100) + '...');
    aiResult = aiResult.replace(/^```json/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(aiResult);
    console.log('Successfully parsed response');
    res.json(parsed);

  } catch (error) {
    console.error('Server error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze text.',
      details: error.message
    });
  }
});

// Add a simple health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', groqKeySet: !!GROQ_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Groq API Key is ${GROQ_API_KEY ? 'set' : 'NOT set'}`);
});