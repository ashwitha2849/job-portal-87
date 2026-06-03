const testReset = async () => {
  try {
    const email = "ashwithamr01@gmail.com";
    console.log(`[TEST] Calling forgot-password for ${email}...`);
    const forgotRes = await fetch('http://localhost:5000/api/company/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const forgotData = await forgotRes.json();
    console.log("[TEST] forgot-password response:", forgotData);

    if (!forgotData.success) {
      throw new Error("Forgot password API failed: " + forgotData.message);
    }

    const otp = forgotData.otp;
    console.log(`[TEST] Retrieved OTP: ${otp}. Calling reset-password...`);

    const resetRes = await fetch('http://localhost:5000/api/company/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp,
        newPassword: "newpassword123"
      })
    });
    const resetData = await resetRes.json();
    console.log("[TEST] reset-password response:", resetData);

    if (!resetData.success) {
      throw new Error("Reset password API failed: " + resetData.message);
    }

    console.log("[TEST] Trying to login with new password...");
    const loginRes = await fetch('http://localhost:5000/api/company/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: "newpassword123"
      })
    });
    const loginData = await loginRes.json();
    console.log("[TEST] login response success:", loginData.success);
    if (!loginData.success) {
      throw new Error("Login failed with new password: " + loginData.message);
    }

    // Reset back to original
    console.log("[TEST] Restoring password via reset flow...");
    const forgotRes2 = await fetch('http://localhost:5000/api/company/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const forgotData2 = await forgotRes2.json();
    
    const resetRes2 = await fetch('http://localhost:5000/api/company/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp: forgotData2.otp,
        newPassword: "ashwithamr01"
      })
    });
    const resetData2 = await resetRes2.json();
    console.log("[TEST] Restore password response:", resetData2);
    
    console.log("[TEST] Full forgot/reset password API flow verified successfully!");
  } catch (error) {
    console.error("[TEST] Test failed:", error.message);
  }
};

testReset();
