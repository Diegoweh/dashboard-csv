import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    messages,
    prompt,
    system,
    model = 'claude-sonnet-4-6',
    max_tokens = 4096,
    stream: useStream = false,
  } = body;

  // Support both formats: { messages } or legacy { prompt }
  const msgs = messages || (prompt ? [{ role: 'user' as const, content: prompt }] : null);

  if (!msgs || !Array.isArray(msgs) || msgs.length === 0) {
    return NextResponse.json({ error: 'messages array or prompt string is required' }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });
  }

  try {
    if (useStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const stream = client.messages.stream({
            model,
            max_tokens,
            ...(system && { system }),
            messages: msgs,
          });
          for await (const event of stream) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const response = await client.messages.create({
      model,
      max_tokens,
      ...(system && { system }),
      messages: msgs,
    });

    // Return full response (content array)
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
