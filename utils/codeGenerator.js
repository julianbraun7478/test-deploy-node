const generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
};

module.exports = { generateVerificationCode };