exports.handler = async function(event) {

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { image: rawImage, mimeType } = JSON.parse(event.body);
    const image = rawImage.includes(',') ? rawImage.split(',')[1] : rawImage;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType || 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: 'Look at this photo of CD spines on a shelf. Read every CD spine you can see, working from left to right (or top to bottom if stacked). Return them IN ORDER as they appear in the photo. For every spine you attempt, include it in the JSON array. Format: [{"artist":"Artist Name","album":"Album Title","confidence":"high"}]. Use confidence "high" if you can clearly read both artist and album, "low" if you can only partially read or are guessing. Include ALL attempts in order. No explanation, just the JSON array.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
   console.log('Claude response:', JSON.stringify(data));
   const text = data.content[0].text.trim().replace(/```json\n?/g,'').replace(/```\n?/g,'');
   const cds = JSON.parse(text);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ cds }) };

  } catch(err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
