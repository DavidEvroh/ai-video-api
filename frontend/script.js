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
    // 2. Defaulting to your live ₦1,000 package page link route
    let basePaystackUrl = "https://paystack.com";
    // 💡 LIVE LINK INJECTION SLOT:
    // PASTE your fresh Creator Bundle (₦4,500) link inside these quotes below!
    // Example: "https://paystack.shop"
    const creatorLink = "https://paystack.shop/pay/g296htppq6";
    // 👑 FUTURE AGENCY INJECTION SLOT (We will add the ₦12,000 link here next!):
    const agencyLink = "https://paystack.shop/pay/jnqj-2772o"; 
    // 3. Check which package plan choice is selected by the user
    const selectedPlanElement = document.querySelector('input[name="pricingPlan"]:checked');
    const selectedPlan = selectedPlanElement ? selectedPlanElement.value : "starter";
    if (selectedPlan === "creator") {
        basePaystackUrl = creatorLink;
    } else if (selectedPlan === "agency") {
        basePaystackUrl = agencyLink;
    }
    // 4. Append absolute trailing slash before query parameters parsing configuration
    const finalCheckoutUrl = `${basePaystackUrl}/?email=${encodeURIComponent(emailValue)}`;
    console.log(`Redirecting client securely to ${selectedPlan} live checkouts: `, finalCheckoutUrl);
    window.location.href = finalCheckoutUrl;
});