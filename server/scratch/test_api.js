async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/users/user', {
      headers: {
        Authorization: 'Bearer null'
      }
    });
    console.log("Response status with Bearer null:", res.status);
    console.log("Response with Bearer null:", await res.json());
  } catch (error) {
    console.error("Error with Bearer null:", error.message);
  }

  try {
    const res = await fetch('http://localhost:5000/api/users/user');
    console.log("Response status with no header:", res.status);
    console.log("Response with no header:", await res.json());
  } catch (error) {
    console.error("Error with no header:", error.message);
  }
}

run();
