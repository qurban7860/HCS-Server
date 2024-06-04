
const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

function filterAndDeduplicateEmails(data) {
    const seen = new Set();
    data.map(d => {
        if(emailRegex.test(d?.email?.toLowerCase()?.trim()) && !seen.has(d?.email?.toLowerCase()?.trim())){
            seen.add(d?.email?.toLowerCase()?.trim());
        }
    });
    return seen
}

function verifyEmail(email){
    return emailRegex.test(email?.toLowerCase()?.trim()) ? email?.toLowerCase()?.trim() : null;
}

module.exports = {
    filterAndDeduplicateEmails,
    verifyEmail,
};