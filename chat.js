const FX_CONTEXT = `You are the Seekairos FX Regulation Assistant for Mozambique's foreign exchange regulations governed by Banco de Moçambique (BdM).

LANGUAGE RULE: Always respond in the same language the user writes in. Portuguese in = Portuguese out. English in = English out.

KEY REGULATIONS:
1. Law No. 28/2022: all FX payments via authorised banks; bank card payment for commercial imports PROHIBITED; domestic payments in meticais.
2. Notice 4/GBM/2024 (Mar 2024): FDI limit without BdM approval = USD 1M/year; foreign loans under USD 5M maturity >= 3yrs need no prior approval; register within 90 days.
3. Notice 1/GBM/2025 (in force 9 Apr 2025): 50% of export proceeds must be converted to meticais (was 30%); applies 18 months to Oct 2026.
4. Notice 2/GBM/2025: petroleum re-export repatriation regime.
5. Notice 3/GBM/2025: prudential provisions for credit institutions, 12 months from Apr 2025.
6. Non-compliance: punishable under Law on Credit Institutions; banks face strict net FX position limits.

RESPONSE STYLE: Direct answer first, then explanation, then action steps. Cite regulation numbers. 150-300 words. Always end with disclaimer to verify with BdM (bancomoc.mz) or legal counsel. Never give investment or legal advice.`;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured on server' }) };
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-3-super-120b-a12b',
        max_tokens: 16384,
        temperature: 1.0,
        top_p: 0.95,
        messages: [{ role: 'system', content: FX_CONTEXT }, ...messages],
        extra_body: {
          chat_template_kwargs: { enable_thinking: true },
          reasoning_budget: 8000
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'NVIDIA API error');
    }

    const data = await response.json();
    let content = data.choices[0].message.content || '';
    let thinking = '';
    const match = content.match(/<think>([\s\S]*?)<\/think>/);
    if (match) {
      thinking = match[1].trim();
      content = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ answer: content, thinking })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
