import { Task, Priority } from '../types';
import { PRIORITY_ORDER } from '../constants';

interface AIPrioritizationResult {
  taskId: string;
  priority: Priority;
  reason: string;
}

interface AITaskSuggestion {
  priority: Priority;
  reason: string;
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const AIService = {
  async prioritizeTasks(
    tasks: Task[],
    apiKey: string,
    model: string
  ): Promise<AIPrioritizationResult[]> {
    if (!apiKey) throw new Error('OpenAI API key is not set. Go to Settings to add it.');
    if (tasks.length === 0) return [];

    const taskList = tasks.map((t, i) => ({
      index: i,
      id: t.id,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      currentPriority: t.priority,
    }));

    const systemPrompt = `You are an expert personal assistant specializing in task prioritization.
Analyze the provided tasks and assign a priority level to each one.
Priority levels: urgent, high, normal, low.

Rules:
- "urgent": Must be done today or is overdue; blocking other work
- "high": Due soon (within 2–3 days) or high business impact
- "normal": Regular tasks with flexible deadlines
- "low": Nice-to-have, can be deferred

Respond ONLY with a valid JSON array. No markdown, no explanation outside JSON.
Format: [{"taskId": "<id>", "priority": "<level>", "reason": "<one sentence reason>"}]`;

    const userPrompt = `Today's date: ${new Date().toISOString().split('T')[0]}

Tasks to prioritize:
${JSON.stringify(taskList, null, 2)}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } }).error?.message ||
          `OpenAI API error: ${response.status}`
      );
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content ?? '[]';

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      const results = JSON.parse(cleaned) as AIPrioritizationResult[];
      return results;
    } catch {
      throw new Error('AI response was not in expected format. Please try again.');
    }
  },

  async suggestTaskPriority(
    title: string,
    description: string,
    dueDate: string | null,
    apiKey: string,
    model: string
  ): Promise<AITaskSuggestion> {
    if (!apiKey) throw new Error('OpenAI API key is not set. Go to Settings to add it.');

    const systemPrompt = `You are an expert personal assistant. Given a task's details, suggest the appropriate priority level.
Priority levels: urgent, high, normal, low.
Respond ONLY with valid JSON. No markdown.
Format: {"priority": "<level>", "reason": "<one sentence explanation>"}`;

    const userPrompt = `Today: ${new Date().toISOString().split('T')[0]}
Task: ${title}
Description: ${description || 'N/A'}
Due Date: ${dueDate || 'Not set'}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } }).error?.message ||
          `OpenAI API error: ${response.status}`
      );
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content ?? '{}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    try {
      return JSON.parse(cleaned) as AITaskSuggestion;
    } catch {
      throw new Error('AI response was not in expected format. Please try again.');
    }
  },

  sortByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    );
  },
};
