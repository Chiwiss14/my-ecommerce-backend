// my-ecommerce-backend/controllers/contactController.js

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendContactMessage = async (req, res, next) => {
    try {
        // Validation is now handled by middleware/validation.js
        const { name, email, subject, message } = req.body;

        const mailOptions = {
            from: `"${name}" <${email}>`,
            to: process.env.CONTACT_EMAIL,
            replyTo: email,
            subject: `New Contact Message: ${subject} (from ${name})`,
            html: `
                <p>You have a new contact message from your e-commerce website:</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr>
                <p>This message was sent from your e-commerce backend.</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "Your message has been sent successfully!"
        });

    } catch (error) {
        console.error("Error sending contact message:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send message. Please try again later."
        });
    }
};