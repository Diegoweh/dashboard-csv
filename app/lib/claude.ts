import { CLAUDE_MODEL } from './data';

export async function callClaude(
  apiKey: string,
  prompt: string,
  maxTokens = 2000
): Promise<string> {
  const resp = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API ${resp.status}`);
  }
  const data = await resp.json();
  // Handle both response formats (unified route)
  if (data.text) return data.text;
  if (data.content) return data.content.map((b: { type?: string; text?: string }) => b.type === 'text' ? b.text : '').join('') || '';
  return '';
}
