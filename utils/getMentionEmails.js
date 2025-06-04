
const getMentionEmails = (htmlContent) => {
    const emailRegex = /<span[^>]*class=["']mention["'][^>]*?(?:email|data-email)=["']([^"']+)["'][^>]*?>/gi
    const emails = new Set()
    let match

    while ((match = emailRegex.exec(htmlContent)) !== null) {
        emails.add(match[1])
    }

    return Array.from(emails)
}

module.exports = { getMentionEmails }