// utils/otp.js

// ============================================================
// OTP UTILITY
//
// This file handles:
// 1. Generating a secure OTP
// 2. Limiting how many OTPs a user can request
// 3. Creating a hash of the OTP instead of storing it directly
// 4. Storing OTP-related data temporarily in Redis
// 5. Returning an OTP session ID for later verification
// ============================================================


// Custom error used when a user requests too many OTPs
const { TooManyRequestsError } = require("./error");

// Application configuration
const { config } = require("../config");

// Redis client for temporary OTP storage
const { redis } = require("../config/redis");

// Library used to generate random OTPs
const otpGenerator = require("otp-generator");

// Node.js built-in crypto module
// Used for HMAC hashing and generating UUIDs
const crypto = require("crypto");


// ============================================================
// CONFIGURATION VALUES
// ============================================================

// Maximum OTP requests allowed per hour
const RATE_MAX = parseInt(config.OTP_RATE_MAX_PER_HOUR || "5", 10);

// OTP expiration time in seconds
const OTP_TTL = parseInt(config.OTP_TTL || "300", 10);

// Secret key used for HMAC hashing
const HMAC_SECRET = config.HMAC_SECRET;


// ============================================================
// CREATE HMAC HASH OF OTP
//
// We should NOT store the plain OTP in Redis.
// Instead, we create a cryptographic hash.
//
// During verification:
// User enters OTP → create HMAC again → compare hashes
// ============================================================

function hmacFor(email, otp) {
    return crypto
        .createHmac("sha256", HMAC_SECRET)
        .update(email + ":" + otp)
        .digest("hex");
}


// ============================================================
// GENERATE AND STORE OTP
//
// Input:
// meta = {
//     firstName,
//     lastName,
//     email,
//     hashedPassword
// }
//
// Process:
// 1. Check OTP request rate limit
// 2. Generate a 6-digit OTP
// 3. Create a unique OTP session ID
// 4. Hash the OTP
// 5. Store hash + user metadata in Redis
// 6. Return the OTP and session ID
// ============================================================

async function generateAndStoreOtp(meta) {

    // --------------------------------------------------------
    // STEP 1: RATE LIMIT OTP REQUESTS
    // --------------------------------------------------------

    // Each email gets its own rate-limit key
    const rateKey = `otp:rate:${meta.email}`;

    // Get the number of OTPs already requested
    const sentCount = parseInt(
        (await redis.get(rateKey)) || "0",
        10
    );

    // Block the request if the maximum limit is reached
    if (sentCount >= RATE_MAX) {
        throw new TooManyRequestsError(
            "Too many OTP requests. Try again later.",
            "OTP_RATE_LIMIT"
        );
    }


    // --------------------------------------------------------
    // STEP 2: GENERATE A 6-DIGIT OTP
    // --------------------------------------------------------

    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });


    // --------------------------------------------------------
    // STEP 3: CREATE A UNIQUE OTP SESSION ID
    //
    // This allows us to identify this specific OTP session.
    // The client can send this ID back during verification.
    // --------------------------------------------------------

    const otpSessionId = crypto.randomUUID();


    // --------------------------------------------------------
    // STEP 4: HASH THE OTP
    //
    // We store the hash instead of the actual OTP.
    // --------------------------------------------------------

    const hashedOtp = hmacFor(meta.email, otp);


    // --------------------------------------------------------
    // STEP 5: STORE OTP SESSION IN REDIS
    //
    // Redis automatically deletes this key after OTP_TTL
    // seconds because of the EX expiration setting.
    // --------------------------------------------------------

    await redis.set(
        `otp:session:${otpSessionId}`,

        JSON.stringify({
            hashedOtp,
            meta
        }),

        {
            EX: OTP_TTL
        }
    );


    // --------------------------------------------------------
    // STEP 6: UPDATE RATE LIMIT COUNTER
    // --------------------------------------------------------

    const newCount = await redis.incr(rateKey);

    // If this is the first OTP request,
    // set the rate-limit window to 1 hour.
    if (newCount === 1) {
        await redis.expire(rateKey, 60 * 60);
    }


    // --------------------------------------------------------
    // STEP 7: RETURN OTP DETAILS
    //
    // OTP will be sent via email by auth.service.js.
    // Session ID will be returned to the controller/client.
    // --------------------------------------------------------

    return {
        otp,
        otpSessionId
    };
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    generateAndStoreOtp
};