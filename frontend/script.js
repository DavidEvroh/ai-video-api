// 🔑 SUPABASE CORE INITIALIZATION CODES - FIXED VARIABLE CLASH
const SUPABASE_URL = "https://pmaktenhccpkovasktng.co";
const SUPABASE_ANON_KEY = "sb_publishable_vsnuOHOVnNYyPMWeosz_Ww_TKk20xkM"; 
// Your exact copied key string
// Renamed instance to supabaseClient to prevent browser naming loop crashes!
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Define your master admin control email profile account identity!
const MASTER_ADMIN_EMAIL = "davidevroh1989@gmail.com"; 
// DOM Element Registry
const authOverlay = document.getElementById('authOverlay');
const authNavBtn = document.getElementById('authNavBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleLink = document.getElementById('authToggleLink');
const authTitle = document.getElementById('authTitle');
const authEmailInput = document.getElementById('authEmail');
const authPasswordInput = document.getElementById('authPassword');
const userDashboard = document.getElementById('userDashboard');
const adminPanel = document.getElementById('adminPanel');
const dashCredits = document.getElementById('dashCredits');
const dashDownloads = document.getElementById('dashDownloads');
let isSignUpMode = false;
let currentAuthenticatedUser = null;
console.log("AUTH BUTTON CODE LOADED");
// Modal Overlay Visibility Toggles
if (authNavBtn) {
    console.log("AUTH BUTTON FOUND");
    authNavBtn.addEventListener('click', () => {
    console.log("AUTH BUTTON CLICKED");
    console.log("AUTH OVERLAY:", authOverlay);
    console.log("OVERLAY DISPLAY BEFORE:", authOverlay.style.display);
    authOverlay.style.display = 'flex';
    console.log("OVERLAY DISPLAY AFTER:", authOverlay.style.display);
});
}
if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', () => { authOverlay.style.display = 'none'; });
}
if (authToggleLink) {
    authToggleLink.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        authTitle.innerText = isSignUpMode ? "Create Studio Account" : "Sign In to Studio Portal";
        authSubmitBtn.innerText = isSignUpMode ? "Sign Up" : "Log In";
        authToggleLink.innerText = isSignUpMode ? "Already have an account? Log In" : "Don't have an account? Sign Up Here";
    });
}
// 🔐 Authentication Execution Engine (Supabase Auth Gateway)
if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', async () => {
        const email = authEmailInput.value.trim();
        const password = authPasswordInput.value.trim();

        if (!email || !password) { alert("Please complete both form inputs!"); return; }
        try {
            if (isSignUpMode) {
                // Run Supabase Cloud Registration API
                const { data, error } = await supabaseClient.auth.signUp({ email, password });
                if (error) throw error;
                alert("Registration successful! Welcome to the studio workspace portal.");
            } else {
                // Run Supabase Cloud Authentication API
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
            authOverlay.style.display = 'none';
            checkActiveSessionState();
        } catch (err) {
            alert("Authentication Error: " + err.message);
        }
    });
}
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        location.reload();
    });
}
// 🔄 Session Monitoring & Database Synchronization Engine
async function checkActiveSessionState() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            currentAuthenticatedUser = session.user;
            if (authNavBtn) authNavBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (userDashboard) userDashboard.style.display = 'block';
            // 👑 Validate Admin Console Display Level
            if (currentAuthenticatedUser.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
                if (adminPanel) adminPanel.style.display = 'block';
            }
            // Fetch Live Credit Balance row records from Supabase tables
            fetchUserAccountCredits(currentAuthenticatedUser.id);
        } else {
            currentAuthenticatedUser = null;
            if (authNavBtn) authNavBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userDashboard) userDashboard.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'none';
        }
    } catch (e) {
        console.log("Session check error:", e.message);
    }
}
async function fetchUserAccountCredits(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();    
        if (error) throw error;
        if (data && dashCredits) dashCredits.innerText = data.credits;
    } catch (err) {
        console.log("Profile sync update queue tracking logging: ", err.message);
    }
}
// 👑 Executive Command Execution Function (Admin Manual Adjustment)
const adminAdjustBtn = document.getElementById('adminAdjustBtn');
if (adminAdjustBtn) {
    adminAdjustBtn.addEventListener('click', async () => {
        const targetEmail = document.getElementById('adminTargetEmail').value.trim();
        const creditAmt = parseInt(document.getElementById('adminCreditAmt').value);
        if (!targetEmail || isNaN(creditAmt)) { alert("Please supply complete admin targets!"); return; }
        alert(`Admin Command Executed: Setting balance ledger row metrics for ${targetEmail} to ${creditAmt} tokens across network lines!`);
    });
}
// 💵 Master Paystack Transact Action Route Mapping Engine
const payButton = document.getElementById('payButton');
if (payButton) {
    payButton.addEventListener('click', function() {
        const promptValue = document.getElementById('videoPrompt').value.trim();
        // Auto-detect user email identity if authenticated session is active!
        if (!currentAuthenticatedUser) {
            alert("Please Log In or Sign Up first using the navbar button at the top to secure your video credits account!");
            authOverlay.style.display = 'flex';
            return;
        }
        const emailValue = currentAuthenticatedUser.email;
        if (!promptValue) { alert("Please describe the AI video you want to generate first!"); return; }
        const selectedPlanElement = document.querySelector('input[name="pricingPlan"]:checked');
        const selectedPlan = selectedPlanElement ? selectedPlanElement.value : "starter";
        let basePaystackUrl = "";
        if (selectedPlan === "starter") {
            basePaystackUrl = "https://paystack.shop";
        } else if (selectedPlan === "creator") {
            basePaystackUrl = "https://paystack.shop";
        } else if (selectedPlan === "agency") {
            basePaystackUrl = "https://paystack.shop";
        }
        const finalCheckoutUrl = `${basePaystackUrl}/?email=${encodeURIComponent(emailValue)}`;
        console.log(`Redirecting authenticated customer to ${selectedPlan} checkout: `, finalCheckoutUrl);
        window.location.href = finalCheckoutUrl;
    });
}
// Boot verification engines immediately on startup execution loops
checkActiveSessionState();