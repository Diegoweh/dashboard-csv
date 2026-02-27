import { CLAUDE_MODEL } from './data';

export async function callClaude(
  apiKey: string,
  prompt: string,
  maxTokens = 1200
): Promise<string> {
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API ${resp.status}`);
  }
  const data = await resp.json();
  return data.content?.map((b: { text?: string }) => b.text || '').join('') || '';
}
