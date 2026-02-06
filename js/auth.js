// Authentication Logic for Flight Management System

let currentUserId = null;

// Tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active form
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tabName}-form`).classList.add('active');

        // Clear messages
        document.getElementById('error-message').innerHTML = '';
        document.getElementById('success-message').innerHTML = '';
    });
});

// Password strength indicator
const regPassword = document.getElementById('reg-password');
const strengthBar = document.getElementById('password-strength-bar');

if (regPassword && strengthBar) {
    regPassword.addEventListener('input', (e) => {
        const password = e.target.value;
        let strength = 0;

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        strengthBar.className = 'password-strength-bar';

        if (strength <= 2) {
            strengthBar.classList.add('strength-weak');
        } else if (strength <= 4) {
            strengthBar.classList.add('strength-medium');
        } else {
            strengthBar.classList.add('strength-strong');
        }
    });
}

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner spinner-sm"></div> <span>Signing in...</span>';

        const response = await api.login({ email, password });

        if (response.success && response.requiresOTP) {
            // Store user ID for OTP verification
            currentUserId = response.userId;

            // Hide login form, show OTP container
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('otp-container').classList.add('active');

            showSuccess('OTP sent to your email. Please check your inbox.');

            // Focus first OTP input
            document.querySelector('.otp-input').focus();
        }
    } catch (error) {
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In</span><span>→</span>';
    }
});

// Register Form Handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userData = {
        firstName: document.getElementById('reg-firstname').value,
        lastName: document.getElementById('reg-lastname').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        password: document.getElementById('reg-password').value
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner spinner-sm"></div> <span>Creating account...</span>';

        const response = await api.register(userData);

        if (response.success) {
            showSuccess('Account created successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = 'web.html';
            }, 1500);
        }
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span><span>→</span>';
    }
});

// OTP Input Handling
const otpInputs = document.querySelectorAll('.otp-input');

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;

        // Only allow numbers
        if (!/^\d*$/.test(value)) {
            e.target.value = '';
            return;
        }

        // Move to next input
        if (value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    // Allow paste
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);

        if (/^\d+$/.test(pastedData)) {
            pastedData.split('').forEach((char, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = char;
                }
            });
            otpInputs[Math.min(pastedData.length, 5)].focus();
        }
    });
});

// Verify OTP Button
document.getElementById('verify-otp-btn').addEventListener('click', async () => {
    const otp = Array.from(otpInputs).map(input => input.value).join('');

    if (otp.length !== 6) {
        showError('Please enter all 6 digits');
        return;
    }

    const btn = document.getElementById('verify-otp-btn');

    try {
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner spinner-sm"></div> Verifying...';

        const response = await api.verifyOTP(currentUserId, otp);

        if (response.success) {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                const user = api.getCurrentUser();
                if (user && user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (user && user.role === 'crew') {
                    window.location.href = 'crew.html';
                } else {
                    window.location.href = 'web.html';
                }
            }, 1000);
        }
    } catch (error) {
        showError(error.message || 'Invalid OTP. Please try again.');
        // Clear OTP inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Verify & Continue';
    }
});

// Resend OTP Button
document.getElementById('resend-otp-btn').addEventListener('click', async () => {
    const btn = document.getElementById('resend-otp-btn');

    try {
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner spinner-sm"></div> Sending...';

        await api.resendOTP(currentUserId);
        showSuccess('New OTP sent to your email');

        // Clear OTP inputs
        otpInputs.forEach(input => input.value = '');
        otpInputs[0].focus();
    } catch (error) {
        showError(error.message || 'Failed to resend OTP');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Resend Code';
    }
});

// Redirect if already authenticated
redirectIfAuthenticated();
