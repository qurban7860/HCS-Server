const fs = require('fs').promises;
const path = require('path');
const { render } = require('template-file');

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

async function loadTemplates() {
    try {
        const [headerHTML, footerHTML, emailHTML] = await Promise.all([
            fs.readFile(path.join(__dirname, '../templates/header.html'), 'utf8'),
            fs.readFile(path.join(__dirname, '../email/templates/footer.html'), 'utf8'),
            fs.readFile(path.join(__dirname, '../email/templates/emailTemplate.html'), 'utf8')
        ]);
        return { headerHTML, footerHTML, emailHTML };
    } catch (error) {
        throw new Error(`Failed to load email templates: ${error.message}`);
    }
}

async function renderEmail(subject, content ) {
    try{
            let hostUrl = process.env.CLIENT_APP_URL || 'https://portal.howickltd.com';

            const { headerHTML, footerHTML, emailHTML } = await loadTemplates();
            
            const header = render(headerHTML, { hostUrl });
            const footer = render(footerHTML, { hostUrl });

        return render(emailHTML, { subject, header, footer, content });
    } catch (e) {
        throw new Error(`Failed to render email templates: ${e.message}`);
    }
}

module.exports = {
    filterAndDeduplicateEmails,
    verifyEmail,
    renderEmail,
};