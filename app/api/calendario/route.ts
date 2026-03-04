import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('');

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
