// 🔑 SUPABASE CORE INITIALIZATION CODES - FIXED VARIABLE CLASH
const SUPABASE_URL = "https://pmaktenhccpkovasktng.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vsnuOHOVnNYyPMWeosz_Ww_TKk20xkM"; 
// Your exact copied key string
// Renamed instance to supabaseClient to prevent browser naming loop crashes!
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true
        }
    }
);
// Define your master admin control email profile account identity!
const MASTER_ADMIN_EMAIL = "davidevroh1989@gmail.com"; 
// DOM Element Registry
const authOverlay = document.getElementById('authOverlay');
const authNavBtn = document.getElementById('authNavBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authToggleLink = document.getElementById('authToggleLink');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const authTitle = document.getElementById('authTitle');
const authEmailInput = document.getElementById('authEmail');
const authFirstNameInput = document.getElementById('authFirstName');
const authLastNameInput = document.getElementById('authLastName');
const authMiddleNameInput = document.getElementById('authMiddleName');
const authUsernameInput = document.getElementById('authUsername');
const authPhoneInput = document.getElementById('authPhone');
const authDateOfBirthInput = document.getElementById('authDateOfBirth');
// Automatically format Date of Birth as DD/MM/YYYY
if (authDateOfBirthInput) {
    authDateOfBirthInput.addEventListener('input', () => {
        const digits = authDateOfBirthInput.value
            .replace(/\D/g, '')
            .slice(0, 8);
        let formattedDate = digits;
        if (digits.length > 4) {
            formattedDate =
                digits.slice(0, 2) + '/' +
                digits.slice(2, 4) + '/' +
                digits.slice(4);
        } else if (digits.length > 2) {
            formattedDate =
                digits.slice(0, 2) + '/' +
                digits.slice(2);
        }
        authDateOfBirthInput.value = formattedDate;
    });
}
const registrationAgreements = document.getElementById('registrationAgreements');
const notRobotCheckbox = document.getElementById('notRobotCheckbox');
const agreeTermsCheckbox = document.getElementById('agreeTermsCheckbox');
const emailVerificationPanel = document.getElementById('emailVerificationPanel');
const verificationEmailInput = document.getElementById('verificationEmail');
const verificationCodeInput = document.getElementById('verificationCode');
const verifyEmailBtn = document.getElementById('verifyEmailBtn');
const confirmAuthPasswordInput = document.getElementById('confirmAuthPassword');
const confirmPasswordField = document.getElementById('confirmPasswordField');
const authPasswordInput = document.getElementById('authPassword');
const passwordRequirements = document.getElementById('passwordRequirements');
const passwordRules = [
    {
        element: document.getElementById('passwordLengthRule'),
        test: password => password.length >= 8,
        label: 'At least 8 characters'
    },
    {
        element: document.getElementById('passwordUpperRule'),
        test: password => /[A-Z]/.test(password),
        label: 'One uppercase letter (A–Z)'
    },
    {
        element: document.getElementById('passwordLowerRule'),
        test: password => /[a-z]/.test(password),
        label: 'One lowercase letter (a–z)'
    },
    {
        element: document.getElementById('passwordNumberRule'),
        test: password => /[0-9]/.test(password),
        label: 'One number (0–9)'
    },
    {
        element: document.getElementById('passwordSymbolRule'),
        test: password => /[&$*?/_-]/.test(password),
        label: 'One symbol (&, $, *, ?, /, _, ., -)'
    }
];
function updatePasswordRequirements() {
    const password = authPasswordInput.value;
    passwordRules.forEach(rule => {
        if (!rule.element) return;
        const passed = rule.test(password);
        rule.element.textContent =
            (passed ? '✓ ' : '○ ') + rule.label;
        rule.element.style.color =
            passed ? '#22c55e' : '';
    });
}
if (authPasswordInput) {
    authPasswordInput.addEventListener(
        'input',
        updatePasswordRequirements
    );
}
const mainPasswordField = document.getElementById('mainPasswordField');
const toggleAuthPasswordBtn = document.getElementById('toggleAuthPassword');
const toggleConfirmAuthPasswordBtn = document.getElementById('toggleConfirmAuthPassword');
/* 👁️ Show or hide the confirmation password */
if (toggleConfirmAuthPasswordBtn && confirmAuthPasswordInput) {
    toggleConfirmAuthPasswordBtn.addEventListener('click', () => {
        const isHidden = confirmAuthPasswordInput.type === 'password';
        confirmAuthPasswordInput.type = isHidden ? 'text' : 'password';
        toggleConfirmAuthPasswordBtn.textContent = '👁';
        toggleConfirmAuthPasswordBtn.setAttribute(
            'aria-label',
            isHidden ? 'Hide confirmation password' : 'Show confirmation password'
        );
        toggleConfirmAuthPasswordBtn.setAttribute(
            'title',
            isHidden ? 'Hide confirmation password' : 'Show confirmation password'
        );
    });
}
const resetPasswordPanel = document.getElementById('resetPasswordPanel');
const newPasswordInput = document.getElementById('newPasswordInput');
const confirmNewPasswordInput = document.getElementById('confirmNewPasswordInput');
const saveNewPasswordBtn = document.getElementById('saveNewPasswordBtn');
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
        // Update the heading and main button
        authTitle.innerText = isSignUpMode
            ? "Create Studio Account"
            : "Sign In to Studio Portal";
        authSubmitBtn.innerText = isSignUpMode
            ? "Sign Up"
            : "Log In";
        authToggleLink.innerText = isSignUpMode
            ? "Already have an account? Log In"
            : "Don't have an account? Sign Up Here";
// Show password requirements only during Sign Up
        if (passwordRequirements) {
            passwordRequirements.style.display =
                isSignUpMode ? 'block' : 'none';
        }
        if (!isSignUpMode) {
            passwordRules.forEach(rule => {
                if (rule.element) {
                    rule.element.textContent = '○ ' + rule.label;
                    rule.element.style.color = '';
                }
            });
        }
        // Show or hide registration-only fields
       const registrationFields = [
    authFirstNameInput,
    authMiddleNameInput,
    authLastNameInput,
            authUsernameInput,
            authPhoneInput,
            authDateOfBirthInput,
            confirmPasswordField,
            registrationAgreements
        ];
        registrationFields.forEach((field) => {
            if (field) {
                field.style.display = isSignUpMode ? '' : 'none';
            }
        });
        // Show or hide the password visibility buttons
        if (toggleConfirmAuthPasswordBtn) {
            toggleConfirmAuthPasswordBtn.style.display =
                isSignUpMode ? '' : 'none';
        }
// Reset and clear password fields when switching modes
        if (authPasswordInput) {
            authPasswordInput.type = 'password';
            authPasswordInput.value = '';
        }
        if (confirmAuthPasswordInput) {
            confirmAuthPasswordInput.type = 'password';
            confirmAuthPasswordInput.value = '';
        }
        // Start with an empty email field when switching modes
        if (authEmailInput) {
            authEmailInput.value = '';
        }
if (toggleAuthPasswordBtn) {
    toggleAuthPasswordBtn.textContent = '👁';
    toggleAuthPasswordBtn.setAttribute('aria-label', 'Show password');
    toggleAuthPasswordBtn.setAttribute('title', 'Show password');
}
if (toggleConfirmAuthPasswordBtn) {
    toggleConfirmAuthPasswordBtn.textContent = '👁';
    toggleConfirmAuthPasswordBtn.setAttribute(
        'aria-label',
        'Show confirmation password'
    );
    toggleConfirmAuthPasswordBtn.setAttribute(
        'title',
        'Show confirmation password'
    );
}
        // Clear registration checkboxes when switching modes
        if (notRobotCheckbox) {
            notRobotCheckbox.checked = false;
        }
        if (agreeTermsCheckbox) {
            agreeTermsCheckbox.checked = false;
        }
    });
}
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async () => {
        const email = authEmailInput.value.trim();
        if (!email) {
            alert("Please enter your admin email address first.");
            return;
        }
        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/?mode=reset-password`
});
            if (error) throw error;
            alert("Password reset email sent. Please check your email inbox.");
        } catch (err) {
            alert("Password reset error: " + err.message);
        }
    });
}
/* 🔄 Detect Supabase Password Recovery */
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        if (resetPasswordPanel) {
            resetPasswordPanel.style.display = 'block';
        }
        if (authTitle) {
            authTitle.innerText = 'Choose a New Password';
        }
        if (authSubmitBtn) {
            authSubmitBtn.style.display = 'none';
        }
        if (authToggleLink) {
            authToggleLink.style.display = 'none';
        }
        if (forgotPasswordLink) {
            forgotPasswordLink.style.display = 'none';
        }
        if (authPasswordInput) {
            authPasswordInput.style.display = 'none';
        }
        if (authOverlay) {
            authOverlay.style.display = 'flex';
        }
    }
});
/* 🔐 Save New Password After Recovery */
if (saveNewPasswordBtn) {
    saveNewPasswordBtn.addEventListener('click', async () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;
        if (!newPassword || !confirmPassword) {
            alert('Please enter and confirm your new password.');
            return;
        }
        if (newPassword.length < 8) {
            alert('Your new password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('The passwords do not match. Please try again.');
            return;
        }
        saveNewPasswordBtn.disabled = true;
        saveNewPasswordBtn.textContent = 'Saving Password...';
        try {
            const { error } = await supabaseClient.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            alert('Password updated successfully! You can now sign in with your new password.');
            newPasswordInput.value = '';
            confirmNewPasswordInput.value = '';
            resetPasswordPanel.style.display = 'none';
authPasswordInput.style.display = '';
            authSubmitBtn.style.display = '';
            authToggleLink.style.display = '';
            forgotPasswordLink.style.display = '';
            authToggleLink.innerText = "Don't have an account? Sign Up Here";
            authSubmitBtn.innerText = 'Log In';
            isSignUpMode = false;
            authTitle.innerText = 'Sign In to Studio Portal';
            authSubmitBtn.innerText = 'Log In';
            authOverlay.style.display = 'flex';
        } catch (err) {
            alert('Password update error: ' + err.message);
        } finally {
            saveNewPasswordBtn.disabled = false;
            saveNewPasswordBtn.textContent = 'Save New Password';
        }
    });
}
if (toggleConfirmAuthPasswordBtn && confirmAuthPasswordInput) {
    toggleConfirmAuthPasswordBtn.addEventListener('click', () => {
        const showing = confirmAuthPasswordInput.type === 'text';
        confirmAuthPasswordInput.type = showing ? 'password' : 'text';
        toggleConfirmAuthPasswordBtn.textContent = showing
            ? 'Show Password'
            : 'Hide Password';
    });
}
// 🔐 Authentication Execution Engine (Supabase Auth Gateway)
if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', async () => {
const email = authEmailInput.value.trim();
const password = authPasswordInput.value;
if (!email || !password) {
    alert("Please enter your email address and password.");
    return;
}
if (isSignUpMode) {
    const firstName = authFirstNameInput.value.trim();
const middleName = authMiddleNameInput.value.trim();
const lastName = authLastNameInput.value.trim();
    const username = authUsernameInput.value.trim();
    const phone = authPhoneInput.value.trim();
    const dateOfBirth = authDateOfBirthInput.value;
    const confirmPassword = confirmAuthPasswordInput.value;
    if (!firstName) {
    alert("Please enter your first name.");
    authFirstNameInput.focus();
    return;
}
if (!lastName) {
    alert("Please enter your last name.");
    authLastNameInput.focus();
    return;
}
    if (!username) {
        alert("Please choose a username.");
        authUsernameInput.focus();
        return;
    }
    if (!phone) {
        alert("Please enter your phone number.");
        authPhoneInput.focus();
        return;
    }
    if (!dateOfBirth) {
        alert("Please enter your date of birth.");
        authDateOfBirthInput.focus();
        return;
    }
    const dobMatch = dateOfBirth.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
if (!dobMatch) {
    alert("Please enter your date of birth as DD/MM/YYYY.");
    authDateOfBirthInput.focus();
    return;
}
const day = Number(dobMatch[1]);
const month = Number(dobMatch[2]);
const year = Number(dobMatch[3]);
const dobDate = new Date(year, month - 1, day);
dobDate.setHours(0, 0, 0, 0);
if (
    dobDate.getFullYear() !== year ||
    dobDate.getMonth() !== month - 1 ||
    dobDate.getDate() !== day
) {
    alert("Please enter a valid calendar date.");
    authDateOfBirthInput.focus();
    return;
}
const today = new Date();
today.setHours(0, 0, 0, 0);
if (dobDate > today) {
    alert("Your date of birth cannot be in the future.");
    authDateOfBirthInput.focus();
    return;
}
    if (password.length < 8) {
        alert("Your password must contain at least 8 characters.");
        authPasswordInput.focus();
        return;
    }
    if (password !== confirmPassword) {
        alert("Your passwords do not match.");
        confirmAuthPasswordInput.focus();
        return;
    }
    if (!notRobotCheckbox.checked) {
        alert("Please tick the I'm not a robot checkbox.");
        notRobotCheckbox.focus();
        return;
    }
    if (!agreeTermsCheckbox.checked) {
        alert("Please agree to the Terms of Service and Privacy Policy.");
        agreeTermsCheckbox.focus();
        return;
    }
}
        const originalButtonText = authSubmitBtn.textContent;
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = isSignUpMode
            ? "Creating Account..."
            : "Signing In...";
        try {
if (isSignUpMode) {
  const firstName = authFirstNameInput.value.trim();
const middleName = authMiddleNameInput.value.trim();
const lastName = authLastNameInput.value.trim();
    const username = authUsernameInput.value.trim();
    const phone = authPhoneInput.value.trim();
    const dateOfBirth = authDateOfBirthInput.value;
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
last_name: lastName,
full_name: [firstName, middleName, lastName]
    .filter(Boolean)
    .join(' '),
                middle_name: middleName || null,
                username: username,
                phone: phone,
                date_of_birth: dateOfBirth
            }
        }
    });
    if (error) throw error;
    if (data.user && !data.session) {
        if (verificationEmailInput) {
            verificationEmailInput.value = email;
        }
        if (emailVerificationPanel) {
            emailVerificationPanel.style.display = 'block';
        }
        if (authSubmitBtn) authSubmitBtn.style.display = 'none';
        if (authToggleLink) authToggleLink.style.display = 'none';
        if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';
if (authFirstNameInput) authFirstNameInput.style.display = 'none';
if (authMiddleNameInput) authMiddleNameInput.style.display = 'none';
if (authLastNameInput) authLastNameInput.style.display = 'none';
        if (authMiddleNameInput) authMiddleNameInput.style.display = 'none';
        if (authUsernameInput) authUsernameInput.style.display = 'none';
        if (authPhoneInput) authPhoneInput.style.display = 'none';
        if (authDateOfBirthInput) authDateOfBirthInput.style.display = 'none';
        if (authEmailInput) authEmailInput.style.display = 'none';
if (mainPasswordField) mainPasswordField.style.display = 'none';
if (confirmPasswordField) confirmPasswordField.style.display = 'none';
        if (authPasswordInput) authPasswordInput.style.display = 'none';
        if (confirmAuthPasswordInput) {
            confirmAuthPasswordInput.style.display = 'none';
        }
        if (toggleAuthPasswordBtn) {
            toggleAuthPasswordBtn.style.display = 'none';
        }
        if (toggleConfirmAuthPasswordBtn) {
            toggleConfirmAuthPasswordBtn.style.display = 'none';
        }
        if (registrationAgreements) {
            registrationAgreements.style.display = 'none';
        }
        alert(
            "Registration received! Check your email for the verification instructions."
        );
        return;
    }
    if (data.session) {
        authOverlay.style.display = 'none';
        await checkActiveSessionState();
    } else {
        alert(
            "Account registration was submitted. Please check your email before signing in."
        );
    }
            } else {
                const { error } =
                    await supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });

                if (error) throw error;

                authOverlay.style.display = 'none';
                await checkActiveSessionState();
            }
        } catch (err) {
            alert("Authentication Error: " + err.message);
        } finally {
            authSubmitBtn.disabled = false;
            authSubmitBtn.textContent = originalButtonText;
        }
    });
}
/* ✉️ Verify New User Email Using One-Time Code */
if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener('click', async () => {
        const email = verificationEmailInput.value.trim();
        const token = verificationCodeInput.value.trim();

        if (!email || !token) {
            alert('Please enter your email address and verification code.');
            return;
        }
        const originalText = verifyEmailBtn.textContent;
        verifyEmailBtn.disabled = true;
        verifyEmailBtn.textContent = 'Verifying...';
        try {
            const { data, error } = await supabaseClient.auth.verifyOtp({
                email: email,
                token: token,
                type: 'signup'
            });
            if (error) throw error;
            alert('Email verified successfully! Welcome to MovieAI Studio.');
            emailVerificationPanel.style.display = 'none';
            verificationCodeInput.value = '';
 // Restore the normal sign-in screen
            if (authSubmitBtn) authSubmitBtn.style.display = '';
            if (authToggleLink) authToggleLink.style.display = '';
            if (forgotPasswordLink) forgotPasswordLink.style.display = '';
            if (authFirstNameInput) authFirstNameInput.style.display = 'none';
if (authMiddleNameInput) authMiddleNameInput.style.display = 'none';
if (authLastNameInput) authLastNameInput.style.display = 'none';
            if (authMiddleNameInput) authMiddleNameInput.style.display = 'none';
            if (authUsernameInput) authUsernameInput.style.display = 'none';
            if (authPhoneInput) authPhoneInput.style.display = 'none';
            if (authDateOfBirthInput) authDateOfBirthInput.style.display = 'none';
            if (registrationAgreements) {
                registrationAgreements.style.display = 'none';
            }
            if (authEmailInput) authEmailInput.style.display = '';
            if (authPasswordInput) {
                authPasswordInput.style.display = '';
                authPasswordInput.type = 'password';
            }
            if (confirmAuthPasswordInput) {
                confirmAuthPasswordInput.style.display = 'none';
                confirmAuthPasswordInput.type = 'password';
                confirmAuthPasswordInput.value = '';
            }
            if (toggleAuthPasswordBtn) {
                toggleAuthPasswordBtn.style.display = '';
                toggleAuthPasswordBtn.textContent = 'Show Password';
            }
            if (toggleConfirmAuthPasswordBtn) {
                toggleConfirmAuthPasswordBtn.style.display = 'none';
                toggleConfirmAuthPasswordBtn.textContent = 'Show Password';
            }
            // Return the form to Sign In mode
            isSignUpMode = false;
            if (authTitle) {
                authTitle.innerText = 'Sign In to Studio Portal';
            }
            if (authSubmitBtn) {
                authSubmitBtn.textContent = 'Log In';
            }
            if (authEmailInput) authEmailInput.value = '';
            if (authPasswordInput) authPasswordInput.value = '';
            if (notRobotCheckbox) notRobotCheckbox.checked = false;
            if (agreeTermsCheckbox) agreeTermsCheckbox.checked = false;
 } catch (error) {
            alert('Email verification failed: ' + error.message);
        } finally {
            verifyEmailBtn.disabled = false;
            verifyEmailBtn.textContent = originalText;
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
/* 👑 Secure Admin Credit Adjustment */
const adminAdjustBtn = document.getElementById('adminAdjustBtn');
if (adminAdjustBtn) {
    adminAdjustBtn.addEventListener('click', async () => {
        const targetEmail = document
            .getElementById('adminTargetEmail')
            .value.trim();
        const creditInput = document
            .getElementById('adminCreditAmt')
            .value.trim();
        if (!targetEmail || creditInput === '') {
            alert('Please enter the customer email and credit balance.');
            return;
        }
        const creditAmt = Number(creditInput);
        if (
            !Number.isSafeInteger(creditAmt) ||
            creditAmt < 0 ||
            creditAmt > 1000000
        ) {
            alert('Enter a whole-number credit balance from 0 to 1,000,000.');
            return;
        }
        if (
            !currentAuthenticatedUser ||
            currentAuthenticatedUser.email?.toLowerCase() !==
                MASTER_ADMIN_EMAIL.toLowerCase()
        ) {
            alert('Admin access required. Please sign in with your admin account.');
            return;
        }
        const confirmed = confirm(
            `Set ${targetEmail}'s total credit balance to ${creditAmt}?\n\nThis replaces their current balance.`
        );

        if (!confirmed) return;
        const originalText = adminAdjustBtn.textContent;
        adminAdjustBtn.disabled = true;
        adminAdjustBtn.textContent = 'Updating credits...';
        try {
            const { data, error } =
                await supabaseClient.functions.invoke(
                    'admin-credit-manager',
                    {
                        body: {
                            targetEmail,
                            credits: creditAmt
                        }
                    }
                );
            if (error) {
                let details = error.message;
                if (error.context) {
                    try {
                        const responseBody = await error.context.json();
                        if (responseBody?.error) {
                            details = responseBody.error;
                        }
                    } catch {
                        // Keep the original error message.
                    }
                }
                throw new Error(details);
            }
            if (!data?.success) {
                throw new Error(
                    data?.error || 'The server did not confirm the credit update.'
                );
            }
            alert(
                `Success! ${targetEmail}'s credit balance is now ${data.credits}.`
            );
            document.getElementById('adminCreditAmt').value = '';
        } catch (err) {
            console.error('Admin credit update failed:', err);
            alert('Credit update failed: ' + err.message);
        } finally {
            adminAdjustBtn.disabled = false;
            adminAdjustBtn.textContent = originalText;
        }
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
            basePaystackUrl = "https://paystack.shop/pay/jic4zlecaf";
        } else if (selectedPlan === "creator") {
            basePaystackUrl = "https://paystack.shop/pay/g296htppq6";
        } else if (selectedPlan === "agency") {
            basePaystackUrl = "https://paystack.shop/pay/jnqj-2772o";
        }
        const finalCheckoutUrl = `${basePaystackUrl}/?email=${encodeURIComponent(emailValue)}`;
        console.log(`Redirecting authenticated customer to ${selectedPlan} checkout: `, finalCheckoutUrl);
        window.location.href = finalCheckoutUrl;
    });
}
// Boot verification engines immediately on startup execution loops
checkActiveSessionState();