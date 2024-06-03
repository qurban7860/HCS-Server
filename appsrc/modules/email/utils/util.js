
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

function filterAndDeduplicateEmails(data) {
    const seen = new Set();
    data.map(d => {
        if (emailRegex.test(d?.email) && !seen.has(d?.email)) {
            seen.add(d?.email);
        }
    });
    return seen
}

function verifyEmail(email){
    emailRegex.test(email) ? email : null;
}

module.exports = {
    filterAndDeduplicateEmails,
    verifyEmail,
};