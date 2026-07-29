import Groq from 'groq-sdk';
import OpenAI from 'openai';

const provider = (process.env.AI_PROVIDER).toLowerCase();

const groqChat = async (systemPrompt, userContent) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return response.choices[0].message.content.trim();
};

const openaiChat = async (systemPrompt, userContent) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });
  return response.choices[0].message.content.trim();
};

const chat = async (systemPrompt, userContent) => {
  if (provider === 'openai') return openaiChat(systemPrompt, userContent);
  if (provider === 'groq') return groqChat(systemPrompt, userContent);
};

const improvePost = async (content) => {
  if (!content || content.trim().length < 6) {
    throw new Error('Please enter a meaningful developer topic or sentence to enhance.');
  }
  const system = `You are a developer community writing assistant. Your job is to polish and improve developer posts to be clearer and more engaging.
IMPORTANT RULE: If the user's input consists of random gibberish, keyboard mash (like "dfgfsgv" or "asdfgh"), completely meaningless character strings, or is not a comprehensible sentence, you MUST reply with exactly this word and nothing else: INVALID_GIBBERISH
Otherwise, return ONLY the improved post text, without any explanations or introductory chat.`;

  const improved = await chat(system, content);
  if (!improved || improved.includes('INVALID_GIBBERISH') || improved.toLowerCase().includes('inappropriate text') || improved.toLowerCase().includes('cannot improve') || improved.toLowerCase().includes('meaningless')) {
    throw new Error('Please enter a meaningful developer topic or sentence to enhance!');
  }
  return improved;
};

const improveQuestion = async (title, body) => {
  if (!title && !body) {
    throw new Error('Please enter a meaningful question title or description first.');
  }
  const system = `You are a technical Q&A writing assistant. Improve the following question to be clearer, specific, and have enough context for someone to answer. Also suggest 1 to 5 relevant lowercase tech tags.
IMPORTANT RULE: If the input title and body are purely random keyboard mash, gibberish (e.g. "dfsfgf", "asdasd"), or completely meaningless, set the body field in the JSON to exactly "INVALID_GIBBERISH".
Return ONLY JSON with format: { "title": "...", "body": "...", "tags": ["tag1", "tag2"] }`;
  const raw = await chat(system, `Title: ${title}\n\nBody: ${body}`);
  try {
    if (String(raw).includes('INVALID_GIBBERISH') || String(raw).toLowerCase().includes('inappropriate text') || String(raw).toLowerCase().includes('cannot improve') || String(raw).toLowerCase().includes('meaningless')) {
      throw new Error('Please enter a meaningful technical question or topic to enhance!');
    }
    let cleaned = raw.replace(/```json|```/g, '').trim();
    let parsed = JSON.parse(cleaned);
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch { }
    }
    if (typeof parsed === 'object' && parsed !== null) {
      if (typeof parsed.body === 'string' && (parsed.body.startsWith('{') || parsed.body.startsWith('```json'))) {
        try {
          const innerCleaned = parsed.body.replace(/```json|```/g, '').trim();
          const innerParsed = JSON.parse(innerCleaned);
          if (innerParsed.title) parsed.title = innerParsed.title;
          if (innerParsed.body) parsed.body = innerParsed.body;
          if (innerParsed.tags) parsed.tags = innerParsed.tags;
        } catch { }
      }
      if (parsed.body === 'INVALID_GIBBERISH' || String(parsed.body).includes('INVALID_GIBBERISH')) {
        throw new Error('Please enter a meaningful technical question or topic to enhance!');
      }
      return {
        title: typeof parsed.title === 'string' ? parsed.title : title,
        body: typeof parsed.body === 'string' ? parsed.body : String(parsed.body || raw),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t).toLowerCase().trim()).filter(Boolean) : []
      };
    }
    return { title, body: raw, tags: [] };
  } catch (err) {
    if (err.message && err.message.includes('meaningful technical question')) {
      throw err;
    }
    return { title, body: raw, tags: [] };
  }
};

const suggestTags = async (content) => {
  const system = `You are a tag classifier for a developer Q&A platform. Given the content, suggest 1-5 relevant technology/topic tags (e.g., react, mongodb, nodejs, typescript, css). Return ONLY a JSON array of lowercase strings, e.g. ["react","typescript"]`;
  const raw = await chat(system, content);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
};

const validateQuestion = async (title, body) => {
  const system = `You are a Q&A quality checker. Analyze this question for clarity and detail. Return JSON: { "isVague": boolean, "warning": "short warning message if vague or empty string", "score": number 1-10 }`;
  const raw = await chat(system, `Title: ${title}\n\nBody: ${body}`);
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { isVague: false, warning: '', score: 5 };
  }
};

export { improvePost, improveQuestion, suggestTags, validateQuestion };
