require('dotenv').config();
const { encryptData, decryptData } = require('./utils/encryption');

console.log('\n========== ENCRYPTION TEST ==========\n');

// Test AES Encryption
const paymentData = {
    cardNumber: '4111111111111111',
    cvv: '123',
    expiryDate: '12/25'
};

console.log('Original:', paymentData);

const encrypted = encryptData(JSON.stringify(paymentData));
console.log('\nEncrypted:', encrypted);

const decrypted = decryptData(encrypted);
console.log('\nDecrypted:', JSON.parse(decrypted));

console.log('\n Encryption working!\n');