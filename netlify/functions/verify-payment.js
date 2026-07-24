const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = JSON.parse(event.body);

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Payment verified' }) };
    } else {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'Signature mismatch' }) };
    }
  } catch (error) {
    console.error('Verification Error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};