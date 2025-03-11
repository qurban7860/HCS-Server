const fs = require('fs');

async function createTicketData() {
    try {
        const filePath = './jiraTickets.json';
        console.log('File path:', filePath);

        if (!fs.existsSync(filePath)) {
            console.error(`Error: ${filePath || "Path"} not found.`);
            return;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const newTicketData = [];

        data.forEach((jt, index) => {
            console.log(`${index + 1} - Processing Ticket: ${jt?.key || ""}`);
            newTicketData.push({
                id: jt?.id,
                key: jt?.key,
                summery: jt?.fields?.summery,
                description: jt?.fields?.description,
                customer: jt?.fields?.customfield_10002?.name || null,
                machine: jt?.fields?.customfield_10069 || null,
                reporter: {
                    name: jt?.fields?.reporter?.displayName || "",
                    email: jt?.fields?.reporter?.emailAddress || ""
                },
                creator: {
                    name: jt?.fields?.creator?.displayName || "",
                    email: jt?.fields?.creator?.emailAddress || ""
                },
                assignee: {
                    name: jt?.fields?.assignee?.displayName || "",
                    email: jt?.fields?.assignee?.emailAddress || ""
                },
                status: {
                    status: jt?.fields?.status?.name || "",
                    statusType: jt?.fields?.status?.statusCategory?.name || "",
                },
                requestType: jt?.fields?.customfield_10010?.requestType?.name || "",
                issueType: jt?.fields?.issuetype?.name || "",
                priority: jt?.fields?.priority?.name || null
            });
        });

        fs.writeFileSync('TicketData.json', JSON.stringify(newTicketData, null, 2));
        console.log('New Ticket Data added!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

createTicketData()