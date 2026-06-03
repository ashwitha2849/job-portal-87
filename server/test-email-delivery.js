const testEmailDelivery = async () => {
  try {
    const email = "ashwithamr01@gmail.com";
    console.log(`[TEST] Triggering forgot-password for ${email} with Nodemailer...`);
    const forgotRes = await fetch('http://localhost:5000/api/company/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const forgotData = await forgotRes.json();
    console.log("[TEST] forgot-password response:", forgotData);

    if (forgotData.success) {
      console.log("[TEST] Email delivery flow triggered successfully!");
    } else {
      console.error("[TEST] Failed:", forgotData.message);
    }
  } catch (error) {
    console.error("[TEST] Failed to call API:", error.message);
  }
};

testEmailDelivery();
