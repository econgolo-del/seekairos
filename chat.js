// Seekairos — Secure API Proxy
// This function keeps your NVIDIA/Anthropic API key hidden from the browser.
// Deploy to Netlify and set environment variables in Netlify Dashboard → Site Settings → Environment Variables:
//   NVIDIA_API_KEY=nvapi-...
//   ANTHROPIC_API_KEY=sk-ant-... (optional, if using Claude)

const FX_CONTEXT = `
You are the Seekairos FX Regulation Assistant, specialising exclusively in Mozambique's foreign exchange (FX) regulations as governed by the Banco de Moçambique (BdM).

IMPORTANT LANGUAGE RULE:
- If the user writes in Portuguese, respond ENTIRELY in Portuguese.
- If the user writes in English, respond ENTIRELY in English.
- Never mix languages in a single response.
- Detect the language from the user's message automatically.

CURRENT REGULATORY KNOWLEDGE BASE:

1. FOREIGN EXCHANGE LAW — Law No. 28/2022 (29 December 2022)
   - Foundational FX law governing all foreign exchange operations in Mozambique
   - All payments to/from abroad must be conducted through the national banking system
   - Payment of commercial imports through bank cards is PROHIBITED
   - Domestic transactions must be settled in meticais (national currency)

2. NOTICE 4/GBM/2024 (21 March 2024) — Capital Operations Liberalisation
   - FDI limit without prior BdM authorisation: increased to MZN 63.2M (USD 1,000,000) per year
   - Financial loans under USD 5,000,000 with maturity ≥3 years: no prior BdM authorisation required
   - Commercial bank must send registration to BdM within 5 working days
   - Foreign investment registration carried out at commercial bank within 90 days of fund entry

3. NOTICE 1/GBM/2025 (2 April 2025) — Exceptional Export Conversion Regime
   - INCREASES conversion rate from 30% to 50% of export proceeds
   - Applies for 18 months from entry into force (April 2025 — October 2026)
   - Applies to all parties involved in FX transactions under the Foreign Exchange Law
   - Came into force: 9 April 2025

4. NOTICE 2/GBM/2025 (2 April 2025) — Petroleum Re-export Regime
   - Establishes system for repatriation and conversion of revenue from re-export of petroleum products

5. NOTICE 3/GBM/2025 (2 April 2025) — Prudential Provisions (Exceptional Regime)
   - Modifies minimum regulatory provisions on overdue credit
   - Applies to all credit institutions and financial companies supervised by BdM
   - In force for 12 months from April 2025

6. KEY RULES FOR BUSINESSES:
   - All import/export payments must go through BdM-authorised banks
   - Exporters must repatriate and convert 50% of earnings to meticais (2025 rule)
   - Companies importing goods for commercial purposes CANNOT use bank cards
   - Justified FX requests must be submitted within 5 working days
   - Non-compliance is punishable under the Law on Credit Institutions and Financial Companies

RESPONSE GUIDELINES:
- Always answer in the same language the user used
- Be specific — cite regulation numbers and dates when relevant
- Structure: direct answer first, then explanation, then what to do next
- Always add a brief disclaimer to verify with BdM or legal counsel
- If outside your knowledge base, direct to bancomoc.mz
- Do NOT give investment or legal advice — regulatory information only
- Keep answers concise but complete (150–300 words)
`.trim();

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const { messages, provider = 'nvidia' } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request' }) };
    }

    let result = {};

    if (provider === 'nvidia') {
      const apiKey = process.env.NVIDIA_API_KEY;
      if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'NVIDIA API key not configured' }) };

      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-super-120b-a12b',
          max_tokens: 16384,
          temperature: 1.0,
          top_p: 0.95,
          messages: [{ role: 'system', content: FX_CONTEXT }, ...messages],
          extra_body: { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 8000 }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'NVIDIA API error');

      let content = data.choices[0].message.content || '';
      let thinking = '';
      const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) { thinking = thinkMatch[1].trim(); content = content.replace(/<think>[\s\S]*?<\/think>/, '').trim(); }
      result = { answer: content, thinking };

    } else {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Anthropic API key not configured' }) };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'interleaved-thinking-2025-05-14'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          thinking: { type: 'enabled', budget_tokens: 8000 },
          system: FX_CONTEXT,
          messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : m.content }))
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Anthropic API error');

      let thinking = '', answer = '';
      for (const block of data.content) {
        if (block.type === 'thinking') thinking = block.thinking;
        if (block.type === 'text') answer = block.text;
      }
      result = { answer, thinking };
    }

    return { statusCode: 200, headers, body: JSON.stringify(result) };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
