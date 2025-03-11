const axios = require('axios');
const fs = require('fs');
const path = require('path');
this.params = { query: { name: "0.0.1" } };
require('dotenv').config();

function getHeader() {
    const tokenString = `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`;
    const base64String = Buffer.from(tokenString).toString('base64');
    const config = {
        headers: {
            'Authorization': `Basic ${base64String}`, "Accept-Encoding": "gzip,deflate,compress"
        },
        timeout: 10000,
    };
    return config;
}

async function getHWKSCHeader() {
    const tokenString = `${process.env.JIRA_HWKSC_USERNAME}:${process.env.JIRA_HWKSC_API_TOKEN}`;
    const base64String = Buffer.from(tokenString).toString('base64');
    const config = {
        headers: {
            'Authorization': `Basic ${base64String}`, "Accept-Encoding": "gzip,deflate,compress"
        },
        timeout: 10000,
    };
    return config;
}

function getURL(endpoint) {
    const jiraHost = process.env.JIRA_HOST;
    const versionUrl = `https://${jiraHost}/${endpoint}`;
    return versionUrl;
}

async function getTickets(req, res, next) {
    try {
        let total;
        let jiraProject = 'HWKSC';

        const URL = getURL("search");
        let HEADER = '';
        if (jiraProject === 'HWKSC') {
            HEADER = await getHWKSCHeader();
        } else {
            HEADER = await getHeader();
        }

        let JQL = `project = ${jiraProject}`;

        let allIssues = [];
        let startAt = 0;
        const maxResults = 100; // Set to a lower number to loop and collect up to 500 records

        while (allIssues.length < 5000) {
            let config = {
                url: URL,
                method: 'get',
                params: {
                    jql: JQL,
                    startAt: startAt,
                    maxResults: maxResults,
                    expand: 'changelog' // Fetch ticket history
                },
                ...HEADER,
            };

            try {
                const response = await axios(config);
                allIssues = allIssues.concat(response.data.issues);
                startAt += maxResults;
                total = response.data.total;
                console.log(" startAt : ", startAt, " total : ", total)
                console.log(" allIssues : ", allIssues?.length)
                // Break the loop if there are no more issues to fetch
                if (response.data.issues.length < maxResults) break;
            } catch (error) {
                console.error('Error fetching data:', error);
                // res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Validation failed!");
                return;
            }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // Format: YYYY-MM-DDTHH-MM-SS
        const fileName = `jira_tickets_${timestamp}.json`;
        // Write to JSON file
        const filePath = path.join(__dirname, fileName);
        fs.writeFileSync(filePath, JSON.stringify(allIssues, null, 2));
        console.log(`file ${fileName} created successfully`)
        // res.json({ maxResults: allIssues?.length, total: total, issues: allIssues?.slice(0, 500) }); // Return only the first 500 issues
    } catch (error) {
        console.log(" error : ", error)
        // res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR));
    }
};


getTickets();