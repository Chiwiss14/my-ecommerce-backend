const bcrypt = require('bcryptjs'); // <--- Import the entire bcryptjs module as 'bcrypt
const { createHmac } = require('crypto'); // <--- Import createHmac from 'crypto'
const crypto = require('crypto'); 

exports.doHash = async (value, saltValue) => {
    const result = await bcrypt.hash(value, saltValue); 
    return result;
}

exports.doHashValidation = async (value, hashedValue) => { 
    const result = await bcrypt.compare(value, hashedValue); 
    return result;
}

exports.hmacHash = (value, key) => { // <--- CHANGED NAME HERE
    const result = createHmac('sha256', key).update(value).digest('hex');
    return result;
}