document.getElementById('payButton').addEventListener('click', function() {
    const promptValue = document.getElementById('videoPrompt').value.trim();
    const emailValue = document.getElementById('userEmail').value.trim();
    // 1. Validation Checks
    if (!promptValue) {
        alert("Please describe the AI video you want to generate first!");
        return;
    }
    if (!emailValue || !emailValue.includes('@')) {
        alert("Please enter a valid email address to receive your credits!");
        return;
    }
    // 2. Your Live Paystack Product Page link
    const basePaystackUrl = "https://paystack.shop/pay/jic4zlecaf";
    // 3. Append metadata parameters so Paystack passes the user's email straight through
    const finalCheckoutUrl = `${basePaystackUrl}/?email=${encodeURIComponent(emailValue)}`;
    console.log("Redirecting client securely to Live Checkout: ", finalCheckoutUrl);
    // 4. Send user straight to the live payment gateway portal
    window.location.href = finalCheckoutUrl;
});