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
    // 2. Locate which pricing radio option is currently active
    const selectedPlanElement = document.querySelector('input[name="pricingPlan"]:checked');
    
    if (!selectedPlanElement) {
        alert("Please select a video credit scale package first!");
        return;
    }
    const selectedPlan = selectedPlanElement.value;
    let basePaystackUrl = "";
    // 3. Clean routing assignment maps matching your exact Paystack Pages
    if (selectedPlan === "starter") {
        basePaystackUrl = "https://paystack.shop/pay/jic4zlecaf";
    } else if (selectedPlan === "creator") {
        basePaystackUrl = "https://paystack.shop/pay/g296htppq6";
    } else if (selectedPlan === "agency") {
        basePaystackUrl = "https://paystack.shop/pay/jnqj-2772o";
    }
    // 4. Assemble trailing slash before query parameters parsing configuration
    const finalCheckoutUrl = `${basePaystackUrl}/?email=${encodeURIComponent(emailValue)}`;
    console.log(`Redirecting to ${selectedPlan} live checkouts: `, finalCheckoutUrl);
    // 5. Send user straight to the live payment gateway portal
    window.location.href = finalCheckoutUrl;
});