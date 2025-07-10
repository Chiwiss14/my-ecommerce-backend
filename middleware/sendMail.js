const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "nsirim61@gmail.com", // Your email address
        pass: "sgfv skzp hztj nguy",  // Your email password or app password
    },

});

module.exports = transporter;