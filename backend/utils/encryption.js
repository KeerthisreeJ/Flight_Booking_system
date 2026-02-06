const crypto = require('crypto');

// AES-256-CBC Encryption
const algorithm = 'aes-256-cbc';

// Get keys from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV = process.env.ENCRYPTION_IV || crypto.randomBytes(16).toString('hex');

// Ensure key is proper length (32 bytes for AES-256)
const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
const iv = Buffer.from(IV.slice(0, 32), 'hex');

/**
 * Encrypt data using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text (hex)
 */
function encryptData(text) {
    try {
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypt data using AES-256-CBC
 * @param {string} encryptedText - Encrypted text (hex)
 * @returns {string} - Decrypted plain text
 */
function decryptData(encryptedText) {
    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed');
    }
}

/**
 * Generate RSA key pair for digital signatures
 * @returns {Object} - Public and private keys
 */
function generateRSAKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });
    
    return { publicKey, privateKey };
}

/**
 * Create digital signature using RSA private key
 * @param {string} data - Data to sign
 * @param {string} privateKey - RSA private key
 * @returns {string} - Digital signature (base64)
 */
function createDigitalSignature(data, privateKey) {
    try {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        const signature = sign.sign(privateKey, 'base64');
        return signature;
    } catch (error) {
        console.error('Signature creation error:', error);
        throw new Error('Failed to create digital signature');
    }
}

/**
 * Verify digital signature using RSA public key
 * @param {string} data - Original data
 * @param {string} signature - Digital signature (base64)
 * @param {string} publicKey - RSA public key
 * @returns {boolean} - True if signature is valid
 */
function verifyDigitalSignature(data, signature, publicKey) {
    try {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        verify.end();
        return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} - Hash (hex)
 */
function hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Random token (hex)
 */
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt using RSA public key (for key exchange)
 * @param {string} data - Data to encrypt
 * @param {string} publicKey - RSA public key
 * @returns {string} - Encrypted data (base64)
 */
function rsaEncrypt(data, publicKey) {
    const buffer = Buffer.from(data, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
}

/**
 * Decrypt using RSA private key (for key exchange)
 * @param {string} encryptedData - Encrypted data (base64)
 * @param {string} privateKey - RSA private key
 * @returns {string} - Decrypted data
 */
function rsaDecrypt(encryptedData, privateKey) {
    const buffer = Buffer.from(encryptedData, 'base64');
    const decrypted = crypto.privateDecrypt(privateKey, buffer);
    return decrypted.toString('utf8');
}

module.exports = {
    encryptData,
    decryptData,
    generateRSAKeyPair,
    createDigitalSignature,
    verifyDigitalSignature,
    hashData,
    generateToken,
    rsaEncrypt,
    rsaDecrypt
};
