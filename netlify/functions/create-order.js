const Razorpay = require('razorpay');

exports.handler = async (event) => {
  // Netlify uses event.httpMethod instead of req.method
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Netlify requires you to parse the body manually
  const { amount } = JSON.parse(event.body); 

  if (!amount || amount < 100) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount. Minimum 100 paise required.' }) };
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const splitAmount = Math.floor(amount / 4);
    const DEV_ACCOUNTS = [
      'acc_Sabari_ID', 
      'acc_Sanjay_ID', 
      'acc_Sreyas_ID', 
      'acc_Vinush_ID'
    ];

    const order = await razorpay.orders.create({
      amount: amount, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      transfers: DEV_ACCOUNTS.map(accountId => ({
        account: accountId,
        amount: splitAmount,
        currency: 'INR',
        on_hold: 0
      }))
    });

    // Netlify requires a specific return object format
    return {
      statusCode: 200,
      body: JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      })
    };
  } catch (error) {
    console.error('Razorpay API Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create Razorpay order' }) };
  }
};