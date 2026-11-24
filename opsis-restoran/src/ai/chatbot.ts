import type { Db } from '../db.js';
import type { Deps } from '../deps.js';
import { AppError, type Restaurant } from '../services/types.js';
import { buildSystemPrompt, executeTool, TOOL_DEFINITIONS, type ToolContext } from './tools.js';

const MAX_HISTORY = 40;       // poruka u povijesti
const MAX_TOOL_ROUNDS = 6;    // zaštita od petlje
const MAX_USER_CHARS = 2000;

/** Skraćuje povijest tako da uvijek počinje korisnikovom tekstualnom porukom (ne tool_resultom). */
function trimHistory(messages: any[]): any[] {
  if (messages.length <= MAX_HISTORY) return messages;
  let start = messages.length - MAX_HISTORY;
  while (start < messages.length) {
    const m = messages[start];
    if (m.role === 'user' && (typeof m.content === 'string' || !m.content.some((c: any) => c.type === 'tool_result'))) break;
    start++;
  }
  return messages.slice(start);
}

/**
 * Jedan korak razgovora: prima poruku gosta, vrti Claude + alate, sprema povijest i vraća odgovor.
 * channel + externalId identificiraju razgovor (npr. 'whatsapp' + broj, 'chat' + ID preglednika).
 */
export async function runChat(
  db: Db, deps: Deps, r: Restaurant,
  opts: { channel: ToolContext['source']; externalId: string; text: string; callerPhone?: string | null },
): Promise<{ reply: string; toolCalls: string[] }> {
  if (!deps.llm) throw new AppError(503, 'chat_disabled', 'Chatbot nije podešen (ANTHROPIC_API_KEY)');
  const text = opts.text.trim().slice(0, MAX_USER_CHARS);
  if (!text) throw new AppError(400, 'empty', 'Prazna poruka');

  let row = (
    await db.query('select id, messages, updated_at from chat_sessions where restaurant_id = $1 and channel = $2 and external_id = $3',
      [r.id, opts.channel, opts.externalId])
  ).rows[0];
  if (!row) {
    row = (
      await db.query(
        `insert into chat_sessions (restaurant_id, channel, external_id) values ($1,$2,$3)
         on conflict (restaurant_id, channel, external_id) do update set updated_at = excluded.updated_at
         returning id, messages, updated_at`,
        [r.id, opts.channel, opts.externalId],
      )
    ).rows[0];
  }
  // razgovor neaktivan dulje od 12 h kreće ispočetka
  const stale = deps.now().getTime() - new Date(row.updated_at).getTime() > 12 * 3600_000;
  let history: any[] = !stale && Array.isArray(row.messages) ? row.messages : [];
  history = trimHistory([...history, { role: 'user', content: text }]);

  const ctx: ToolContext = { source: opts.channel, callerPhone: opts.callerPhone ?? null };
  const toolCalls: string[] = [];
  let reply = '';
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await deps.llm.create({
      model: deps.config.anthropicModel,
      max_tokens: 800,
      system: buildSystemPrompt(r, deps.now(), opts.channel),
      messages: history,
      tools: TOOL_DEFINITIONS as any,
    });
    history.push({ role: 'assistant', content: res.content });
    const uses = res.content.filter((c: any) => c.type === 'tool_use');
    if (res.stop_reason !== 'tool_use' || uses.length === 0) {
      reply = res.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n').trim();
      break;
    }
    const results = [];
    for (const u of uses) {
      toolCalls.push(u.name);
      const out = await executeTool(db, deps, r, u.name, u.input ?? {}, ctx);
      results.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out) });
    }
    history.push({ role: 'user', content: results });
  }
  if (!reply) reply = 'Ispričavam se, nešto je pošlo krivo. Molimo nazovite restoran.';

  await db.query('update chat_sessions set messages = $2, updated_at = $3 where id = $1', [row.id, JSON.stringify(trimHistory(history)), deps.now()]);
  return { reply, toolCalls };
}

/** Briše stare razgovore (GDPR: ne čuvamo chat dulje nego treba). */
export async function purgeOldChats(db: Db, olderThanDays = 30) {
  await db.query(`delete from chat_sessions where updated_at < now() - ($1 || ' days')::interval`, [String(olderThanDays)]);
}
