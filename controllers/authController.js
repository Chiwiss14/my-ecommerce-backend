const {
  signupSchema,
  signinSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("../middleware/validator");
// You will need to create and import 'acceptCodeSchema' for the verify route
const { acceptCodeSchema } = require("../middleware/validator"); // <-- UNCOMMENT & DEFINE THIS IN validator.js

const { doHash, doHashValidation, hmacHash } = require("../utils/hashing"); // Corrected to hmacHash
const User = require("../models/usersModel");
const jwt = require("jsonwebtoken");
const transporter = require("../middleware/sendMail"); // Import the transporter for sending emails

exports.signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error } = signupSchema.validate({ email, password });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const existingUser = await User.findOne({ email });
    // Check if the user already exists
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await doHash(password, 12);

    const newUser = new User({ email, password: hashedPassword });
    const result = await newUser.save();
    result.password = undefined; // Remove password from the response
    res.status(201).json({
      success: true,
      message: "Your account has been created!",
      result,
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({
      success: false,
      message: "Server error during signup",
      error: error.message,
    });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { error } = signinSchema.validate({ email, password });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const existingUser = await User.findOne({ email }).select("+password"); // Include password in the query

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "User does not exist",
      });
    }

    const isPasswordValid = await doHashValidation(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
        role: existingUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.cookie("Authorization", "Bearer " + token, {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: process.env.NODE_ENV === "production",
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({
      success: true,
      message: "Signin successful",
      token,
      user: {
        // <-- Include the user object with relevant details
        id: existingUser._id,
        email: existingUser.email,
        verified: existingUser.verified,
        role: existingUser.role, // <--- Crucially, send the role here
        // You can add other non-sensitive user properties if your frontend needs them immediately
        // e.g., username: existingUser.username,
      },
      // Optional: You could also send a suggested redirect path directly
      // redirectPath: existingUser.role === 'admin' ? '/admin/dashboard' : '/'
    });
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).json({
      success: false,
      message: "Server error during signin",
      error: error.message,
    });
  }
};

exports.signout = async (req, res) => {
  res.clearCookie("Authorization"); // Clear the cookie
  res.status(200).json({
    success: true,
    message: "Signout successful",
  });
};

exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified.",
      });
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code

    const hashedCodeValue = hmacHash(
      // Corrected function name
      codeValue,
      process.env.HMACH_VERIFICATION_CODE_SECRET
    );

    user.verificationCode = hashedCodeValue; // Store the hashed code
    user.verificationCodeExpiresAt = Date.now() + 15 * 60 * 1000; // Set expiration to 15 mins
    await user.save();

    let info = await transporter.sendMail({
      from: process.env.NODE_CODE_EMAIL_ADDRESS, // Corrected env variable name
      to: user.email,
      subject: "E-commerce App: Your Email Verification Code", // Improved subject
      html: `
        <p>Hello,</p>
        <p>Your email verification code for your E-commerce App account is:</p>
        <h2 style="color: #007bff; font-size: 24px;">${codeValue}</h2>
        <p>This code is valid for 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      `, // Improved HTML body
    });

    if (info.accepted && info.accepted.includes(user.email)) {
      // Check if email was accepted
      res.status(200).json({
        success: true,
        message: "Verification code sent to your email.",
      });
    } else {
      // This else block handles cases where email might not be accepted
      console.error("Email not accepted by mail server for:", user.email, info);
      res.status(400).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
        // Optionally include info: info for debugging
      });
    }
  } catch (error) {
    console.error("Error during sending verification email:", error);
    res.status(500).json({
      success: false,
      message: "Server error during sending verification email.",
      error: error.message,
    });
  }
};

exports.verifyVerificationCode = async (req, res) => {
  const { email, code } = req.body; // Changed 'providedCode' to 'code' for consistency with schema below
  try {
    // You need to define 'acceptCodeSchema' in your validator.js
    const { error } = acceptCodeSchema.validate({ email, code });
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const user = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeExpiresAt" // Corrected field names
    );

    if (
      !user.verificationCode ||
      !user.verificationCodeExpiresAt || // Check if expiration timestamp exists
      user.verificationCodeExpiresAt < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No active verification code found or code has expired. Please request a new one.",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified.",
      });
    }

    // Check if a verification code exists and has not expired
    if (
      !user.verificationCode ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt < Date.now() // Corrected expiration check logic
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No active verification code found or code has expired. Please request a new one.",
      });
    }

    // Hash the provided code from the user using the same secret
    const hashedProvidedCode = hmacHash(
      // Using hmacHash
      code, // Use 'code' from req.body
      process.env.HMACH_VERIFICATION_CODE_SECRET
    );

    // Compare the hashed code from the user with the hashed code stored in the database
    if (hashedProvidedCode === user.verificationCode) {
      // Corrected comparison
      user.verified = true; // Mark user as verified
      user.verificationCode = undefined; // Clear the code after successful verification
      user.verificationCodeExpiresAt = undefined; // Clear the expiry time
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Email successfully verified!",
      });
    } else {
      // If the codes don't match
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error during verification code process:", error); // Changed to console.error
    res.status(500).json({
      success: false,
      message: "Server error during verification process.",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  const { userId, verified } = req.user; // Extract userId and verified status from the request
  const { oldPassword, newPassword } = req.body;
  try {
    const { error, value } = changePasswordSchema.validate({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res.status(401).json({
        success: false,
        message: error.details[0].message,
      });
    }

    if (!verified) {
      return res.status(401).json({
        success: false,
        message: "You need to verify your email before changing your password.",
      });
    }
    const user = await User.findOne({ _id: userId }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist.",
      });
    }
    const result = await doHashValidation(oldPassword, user.password);
    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect.",
      });
    }
    const hashedNewPassword = await doHash(newPassword, 12);
    user.password = hashedNewPassword; // Update the password
    await user.save(); // Save the updated user document
    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.log(error);
  }
};

exports.sendForgotPasswordCode = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code

    const hashedCodeValue = hmacHash(
      // Corrected function name
      codeValue,
      process.env.HMACH_VERIFICATION_CODE_SECRET
    );

    user.forgotPasswordCode = hashedCodeValue; // Store the hashed code
    user.forgotPasswordCodeValidation = Date.now() + 15 * 60 * 1000; // Set expiration to 15 mins
    await user.save();

    let info = await transporter.sendMail({
      from: process.env.NODE_CODE_EMAIL_ADDRESS, // Corrected env variable name
      to: user.email,
      subject: "E-commerce App: Password Reset Code", // Improved subject
      html: `
                <p>Hello,</p>
                <p>You requested a password reset for your E-commerce App account.</p>
                <p>Your password reset code is:</p>
                <h2 style="color: #007bff; font-size: 24px;">${codeValue}</h2>
                <p>This code is valid for 15 minutes. Please use it to reset your password.</p>
                <p>If you did not request this, please ignore this email or contact support.</p>
            `,
    });

    if (info.accepted && info.accepted.includes(user.email)) {
      // Check if email was accepted
      res.status(200).json({
        success: true,
        message: "Password reset code sent to your email.",
      });
    } else {
      // Handle cases where email might not be accepted by the mail server
      console.error("Email not accepted by mail server for:", user.email, info);
      res.status(400).json({
        success: false,
        message: "Failed to send password reset email. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error during sending password reset email:", error);
    res.status(500).json({
      success: false,
      message: "Server error during sending password reset email.",
      error: error.message,
      // Only include error.message in development, not production for security
    });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    // Validate input against the new resetPasswordSchema
    const { error } = resetPasswordSchema.validate({
      email,
      code,
      newPassword,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Find the user, ensuring we select the forgotten password fields
    const user = await User.findOne({ email }).select(
      "+forgotPasswordCode +forgotPasswordCodeValidation" // Select these specific fields
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // 1. Check if a forgot password code exists and has not expired
    if (
      !user.forgotPasswordCode ||
      !user.forgotPasswordCodeValidation ||
      user.forgotPasswordCodeValidation < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No active password reset code found or code has expired. Please request a new one.",
      });
    }

    // 2. Hash the provided code from the user using the same secret
    const hashedProvidedCode = hmacHash(
      code,
      process.env.HMACH_VERIFICATION_CODE_SECRET
    );

    // 3. Compare the hashed provided code with the stored hashed code
    if (hashedProvidedCode !== user.forgotPasswordCode) {
      return res.status(400).json({
        success: false,
        message: "Invalid password reset code. Please try again.",
      });
    }

    // 4. Hash the new password
    const hashedPassword = await doHash(newPassword, 10); // Use a salt round (e.g., 10)

    // 5. Update user's password and clear reset code fields
    user.password = hashedPassword;
    user.forgotPasswordCode = undefined; // Clear the code after successful reset
    user.forgotPasswordCodeValidation = undefined; // Clear the expiry time
    user.verified = true; // Mark as verified if they weren't already (password reset implies email control)
    await user.save(); // Save the updated user document

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    res.status(500).json({
      success: false,
      message: "Server error during password reset process.",
      error: error.message,
    });
  }
};
