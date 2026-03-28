/**
 * Netlify Function: AI Proxy
 * Acts as a secure bridge to hide API keys and avoid CORS issues.
 */
exports.handler = async (event) => {
  // 1. Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  // 2. Get environment variables (Private)
  const API_KEY = process.env.OPENAI_API_KEY;
  const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API Key is not configured on Netlify.' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // 3. Forward the request to OpenAI / OpenRouter
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    // 4. Return the response back to the browser
    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        // Enable CORS for development if needed, though same-origin is default on Netlify
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTION"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('[AI Proxy Error]:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error in Proxy' })
    };
  }
};
