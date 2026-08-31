// OTP UTILITY
// This file generates OTPs, limits OTP requests,
// hashes the OTP, and temporarily stores registration
// data inside Redis.

const { TooManyRequestsError } = require("./error");
const { config } = require("../config");
const { redis } = require("../config/redis");
const otpGenerator = require("otp-generator");
const crypto = require("crypto");


const RATE_MAX = parseInt(config.OTP_RATE_MAX_PER_HOUR || "5", 10);

const OTP_TTL = parseInt(config.OTP_TTL || "300", 10);

const HMAC_SECRET = config.HMAC_SECRET;


// Create a hash for the OTP instead of storing
// the actual OTP directly in Redis.
function hmacFor(email, otp) {
    return crypto
        .createHmac("sha256", HMAC_SECRET)
        .update(email + ":" + otp)
        .digest("hex");
}


// Generate an OTP and temporarily store its related data.
async function generateAndStoreOtp(meta) {

    // Create a Redis key to track how many OTPs
    // this email has requested.
    const rateKey = `otp:rate:${meta.email}`;

    const sentCount = parseInt(
        await redis.get(rateKey) || "0",
        10
    );


    // Prevent excessive OTP requests.
    if (sentCount >= RATE_MAX) {
        throw new TooManyRequestsError(
            "Too many OTP requests. Try again later.",
            "OTP_RATE_LIMIT"
        );
    }


    // Generate a 6-digit numeric OTP.
    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false
    });


    // Create a unique session ID for this OTP request.
    const otpSessionId = crypto.randomUUID();


    // Hash the OTP before storing it.
    const hashed = hmacFor(meta.email, otp);


    // Store the hashed OTP and registration data temporarily.
    await redis.set(
        `otp:session:${otpSessionId}`,
        JSON.stringify({
            hashedOtp: hashed,
            meta
        }),
        "EX",
        OTP_TTL
    );


    // Increase the number of OTP requests made by this email.
    await redis.incr(rateKey);


    // Set the expiry time for the rate-limit counter
    // only when this is the first request.
    if (sentCount === 0) {
        await redis.expire(rateKey, 60 * 60);
    }


    // Return the real OTP so it can be sent through email,
    // along with the session ID needed for verification.
    return {
        otp,
        otpSessionId
    };
}


module.exports = {
    generateAndStoreOtp
};