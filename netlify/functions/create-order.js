const Razorpay = require('razorpay');

exports.handler = async (event) => {
  // 1. Guard against wrong methods
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let amount;
  
  // 2. Safe Parsing: This prevents the 502 crash if the frontend sends a weird payload
  try {
    const body = JSON.parse(event.body);
    amount = body.amount;
  } catch (parseError) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body sent from frontend' }) };
  }

  // Razorpay expects amounts in PAISE (e.g., 99 INR = 9900 paise)
  if (!amount || amount < 100) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount. Minimum 100 paise required.' }) };
  }

  // 3. Ensure API keys exist so the Razorpay SDK doesn't crash the function
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('CRITICAL: Missing Razorpay environment variables in Netlify.');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration: Missing API keys' }) };
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 4. Removed the fake transfers array. 
    // You CANNOT pass dummy strings to Razorpay Route. Add this back only when you have real 'acc_xxx' IDs.
    const order = await razorpay.orders.create({
      amount: amount, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      })
    };
  } catch (error) {
    // 5. Actually log the precise Razorpay error back to the frontend so you aren't guessing
    console.error('Razorpay API Error Details:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Failed to create Razorpay order',
        details: error.description || error.message || 'Unknown Razorpay Error'
      }) 
    };
  }
};
