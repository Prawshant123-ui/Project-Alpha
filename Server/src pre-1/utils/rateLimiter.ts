import rateLimit from "express-rate-limit";


const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: "Too many request! Try again"

})

const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: "Too many login attempts",
});

export { apiLimiter, loginLimiter }