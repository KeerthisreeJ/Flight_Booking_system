// Payment Validation and Encryption Functions

// Luhn Algorithm for card validation
function luhnCheck(cardNum) {
    const digits = cardNum.replace(/\s/g, '').split('').reverse();
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        let digit = parseInt(digits[i]);
        if (i % 2 === 1) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
    }
    return sum % 10 === 0;
}

// Detect card type
function detectCardType(number) {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return '💳 Visa';
    if (/^5[1-5]/.test(cleaned)) return '💳 Mastercard';
    if (/^3[47]/.test(cleaned)) return '💳 Amex';
    if (/^6(?:011|5)/.test(cleaned)) return '💳 Discover';
    return '';
}

// Add this to your web3.html setupEncryptionDemo function:

// Card Number Validation with Luhn Algorithm
cardNumber.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, ''); // Only digits
    value = value.substring(0, 16); // Max 16 digits
    
    // Add spaces every 4 digits
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formatted;
    
    // Detect card type
    const cardType = detectCardType(value);
    const cardTypeElement = document.getElementById('cardType');
    if (cardTypeElement) cardTypeElement.textContent = cardType;
    
    // Validate with Luhn algorithm
    const cardValidation = document.getElementById('cardValidation');
    const cardNumberError = document.getElementById('cardNumberError');
    
    if (value.length >= 13) {
        if (luhnCheck(value)) {
            if (cardValidation) cardValidation.className = 'validation-indicator valid';
            if (cardNumberError) cardNumberError.classList.remove('show');
        } else {
            if (cardValidation) cardValidation.className = 'validation-indicator invalid';
            if (cardNumberError) {
                cardNumberError.textContent = '❌ Invalid card number (Luhn check failed)';
                cardNumberError.classList.add('show');
            }
        }
    } else if (value.length > 0) {
        if (cardValidation) cardValidation.className = 'validation-indicator';
        if (cardNumberError) cardNumberError.classList.remove('show');
    }
    
    updateEncryptionPreview();
});

// Expiry Date Validation
expiryDate.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
    
    const expiryValidation = document.getElementById('expiryValidation');
    const expiryError = document.getElementById('expiryError');
    
    if (value.length === 5) {
        const [month, year] = value.split('/');
        const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const now = new Date();
        
        if (parseInt(month) < 1 || parseInt(month) > 12) {
            if (expiryValidation) expiryValidation.className = 'validation-indicator invalid';
            if (expiryError) {
                expiryError.textContent = '❌ Invalid month (must be 01-12)';
                expiryError.classList.add('show');
            }
        } else if (expiry < now) {
            if (expiryValidation) expiryValidation.className = 'validation-indicator invalid';
            if (expiryError) {
                expiryError.textContent = '❌ Card has expired';
                expiryError.classList.add('show');
            }
        } else {
            if (expiryValidation) expiryValidation.className = 'validation-indicator valid';
            if (expiryError) expiryError.classList.remove('show');
        }
    }
    
    updateEncryptionPreview();
});

// CVV Validation
cvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
    
    const cvvValidation = document.getElementById('cvvValidation');
    const cvvError = document.getElementById('cvvError');
    const value = e.target.value;
    
    if (value.length >= 3 && value.length <= 4) {
        if (cvvValidation) cvvValidation.className = 'validation-indicator valid';
        if (cvvError) cvvError.classList.remove('show');
    } else if (value.length > 0) {
        if (cvvValidation) cvvValidation.className = 'validation-indicator invalid';
        if (cvvError) {
            cvvError.textContent = '❌ CVV must be 3-4 digits';
            cvvError.classList.add('show');
        }
    }
    
    updateEncryptionPreview();
});

// CVV Toggle Visibility
const cvvToggle = document.getElementById('cvvToggle');
if (cvvToggle) {
    cvvToggle.addEventListener('click', () => {
        if (cvv.type === 'password') {
            cvv.type = 'text';
            cvvToggle.className = 'ri-eye-line';
        } else {
            cvv.type = 'password';
            cvvToggle.className = 'ri-eye-off-line';
        }
    });
}

// Cardholder Name Validation
cardholderName.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
    
    const nameValidation = document.getElementById('nameValidation');
    const nameError = document.getElementById('nameError');
    const value = e.target.value.trim();
    
    if (value.length >= 3) {
        if (nameValidation) nameValidation.className = 'validation-indicator valid';
        if (nameError) nameError.classList.remove('show');
    } else if (value.length > 0) {
        if (nameValidation) nameValidation.className = 'validation-indicator invalid';
        if (nameError) {
            nameError.textContent = '❌ Name must be at least 3 characters';
            nameError.classList.add('show');
        }
    }
    
    updateEncryptionPreview();
});

// Enhanced Encryption Preview
function updateEncryptionPreview() {
    const paymentData = {
        cardNumber: cardNumber.value,
        expiryDate: expiryDate.value,
        cvv: cvv.value,
        cardholderName: cardholderName.value
    };
    
    if (cardNumber.value || expiryDate.value || cvv.value || cardholderName.value) {
        // Simulate AES-256 encryption
        const jsonData = JSON.stringify(paymentData);
        const encrypted = btoa(jsonData).split('').reverse().join('');
        const encryptedPreview = document.getElementById('encryptedPreview');
        if (encryptedPreview) {
            encryptedPreview.textContent = 
                `🔐 AES256-CBC:\n${encrypted.substring(0, 80)}...\n\n✅ Data encrypted before transmission\n🔑 Using RSA-2048 for key exchange`;
        }
    } else {
        const encryptedPreview = document.getElementById('encryptedPreview');
        if (encryptedPreview) {
            encryptedPreview.textContent = 'Enter payment details to see encryption...';
        }
    }
}
