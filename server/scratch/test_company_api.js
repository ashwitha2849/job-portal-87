async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/company/company', {
      headers: {
        token: 'invalid_token_value'
      }
    });
    console.log("Response status with invalid token:", res.status);
    console.log("Response with invalid token:", await res.json());
  } catch (error) {
    console.error("Error with invalid token:", error.message);
  }

  try {
    const res = await fetch('http://localhost:5000/api/company/company');
    console.log("Response status with no token:", res.status);
    console.log("Response with no token:", await res.json());
  } catch (error) {
    console.error("Error with no token:", error.message);
  }
}

run();
