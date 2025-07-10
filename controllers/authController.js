const { signupSchema, signinSchema } = require("../middleware/validator"); 
const { doHash, doHashValidation } = require("../utils/hashing"); 
const User = require('../models/usersModel');
const jwt = require('jsonwebtoken');
const transporter = require('../middleware/sendMail'); // Import the transporter for sending emails
const { hmacProcess } = require("../utils/hashing");


exports.signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signupSchema.validate({ email, password });

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            })
        }
        const existingUser = await User.findOne({ email });
        // Check if the user already exists
        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: 'User already exists'
            })
        }

        const hashedPassword = await doHash(password, 12);

        const newUser = new User({ email, password: hashedPassword }); // Assuming 'password' in model refers to hashed password
        const result = await newUser.save();
        result.password = undefined; // Remove password from the response
        res.status(201).json({ success: true, message: 'Your account has been created!', result });


    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ success: false, message: 'Server error during signup', error: error.message }); // Added error response
    }
};

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const { error, value } = signinSchema.validate({ email, password }); 

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.details[0].message
            })
        }
        const existingUser = await User.findOne({ email }).select('+password'); // Include password in the query

        if (!existingUser) {
            return res.status(401).json({
                success: false,
                message: 'User does not exist'
            })
        }

        const isPasswordValid = await doHashValidation(password, existingUser.password); // Changed 'result' to 'isPasswordValid' for clarity
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign({
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified
        },
            process.env.JWT_SECRET, 
            { expiresIn: '3d' } // You can explicitly set '3d' if you want 3 days
        );

        res.cookie('Authorization', 'Bearer ' + token, { // Added space after 'Bearer'
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Cookie expires in 3 days
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({
            success: true,
            message: 'Signin successful',
            token
        });

    } catch (error) {
        console.error('Error during signin:', error); // Changed to console.error
        res.status(500).json({ success: false, message: 'Server error during signin', error: error.message }); // Added error response
    }
};

exports.signout=async(req, res) => {
   res.clearCookie('Authorization'); // Clear the cookie
   res.status(200).json({
       success: true,
       message: 'Signout successful'
   }); 
} 

exports.sendVerificationEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.verified) {
            return res.status(400).json({
                success: false,
                message: 'User already verified'
            });
        }
        const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code
        let info= await transporter.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS, // Sender address
            to:user.email, // List of recipients
            subject: 'Email Verification Code', // Subject line
            html: '<h1>' +codeValue +'</h1>' // HTML body content
        });

        if (info.accepted[0]=== user.email) {
          const hashedCodeValue = hmacProcess(codeValue, process.env.HMACH_VERIFICATION_CODE_SECRET);
          user.verificationCode = hashedCodeValue; // Store the hashed code in the user document
          user.verificationCodeValue=Date.now() + 15 * 60 * 1000; // Set the code to expire in 15 minutes
          await user.save(); // Save the user document with the new verification code
          res.status(200).json({
              success: true,
              message: 'Verification code sent successfully',
              info: info
          });
        }
        
        res.status(400).json({success: false, message: 'Failed to send verification email', info: info });
    }catch (error) {
        console.error('Error during sending verification email:', error);
        res.status(500).json({ success: false, message: 'Server error during sending verification email', error: error.message });
    }}