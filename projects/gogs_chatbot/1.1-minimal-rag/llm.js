import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

config();

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  throw new Error('CLAUDE_API_KEY must be set in .env');
}

const client = new Anthropic({
  apiKey: CLAUDE_API_KEY
});

/**
 * Claude API를 사용하여 응답 생성
 */
export async function callClaude(prompt, maxTokens = 1024) {
  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return message.content[0].text;
  } catch (error) {
    console.error(`Claude API call failed: ${error.message}`);
    throw error;
  }
}

/**
 * 프롬프트 생성
 */
export function generatePrompt(query, context) {
  const contextStr = context
    .map((ctx, idx) => `[참고 ${idx + 1}] 파일: ${ctx.fileName}\n${ctx.line}`)
    .join('\n\n');

  return `당신은 소프트웨어 프로젝트의 기술 지원 챗봇입니다.

사용자 질문: ${query}

다음은 저장소에서 검색한 관련 정보입니다:
${contextStr || '(검색 결과 없음)'}

질문에 대한 답변을 제공하고, 가능하면 저장소의 관련 정보를 참고하여 구체적인 답변을 제공해주세요.`;
}

/**
 * 질문과 콘텍스트를 기반으로 답변 생성
 */
export async function generateAnswer(query, context) {
  const prompt = generatePrompt(query, context);
  return await callClaude(prompt);
}

/**
 * 스트리밍으로 응답 생성 (콜백 함수 사용)
 */
export async function callClaudeStream(prompt, onChunk) {
  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        onChunk(chunk.delta.text);
      }
    }

    return await stream.finalMessage();
  } catch (error) {
    console.error(`Claude streaming API call failed: ${error.message}`);
    throw error;
  }
}

/**
 * 메타데이터와 함께 응답 생성
 */
export async function generateAnswerWithMetadata(query, context) {
  const prompt = generatePrompt(query, context);
  const startTime = Date.now();

  try {
    const response = await callClaude(prompt);
    const endTime = Date.now();

    return {
      query: query,
      answer: response,
      context: context,
      metadata: {
        model: 'claude-opus-4-6',
        tokens_used: Math.ceil(response.length / 4),
        response_time_ms: endTime - startTime,
        context_items: context.length
      }
    };
  } catch (error) {
    throw error;
  }
}

export default {
  callClaude,
  generatePrompt,
  generateAnswer,
  callClaudeStream,
  generateAnswerWithMetadata
};
