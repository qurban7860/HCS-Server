const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Ticket = require('../appsrc/modules/tickets/models/ticket');
const TicketChangeHistory = require('../appsrc/modules/tickets/models/ticketChangeHistory');
const SecurityUser = require('../appsrc/modules/security/models/securityUser');
const CustomerContact = require('../appsrc/modules/crm/models/customerContact');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Helper function to find SecurityUser for a CustomerContact
const findSecurityUserForContact = async (contactId) => {
    if (!contactId) return null;
    
    try {
        const securityUsers = await SecurityUser.find({ contact: contactId }).populate('contact');
        
        if (securityUsers.length === 0) {
            console.log(`No SecurityUser found for contact: ${contactId}`);
            return null;
        }
        
        if (securityUsers.length === 1) {
            return securityUsers[0]._id;
        }
        
        // If multiple users, prefer the one with 'howickltd.com' email
        const howickUser = securityUsers.find(user => 
            user.email && user.email.includes('howickltd.com')
        );
        
        if (howickUser) {
            console.log(`Found preferred howickltd.com user for contact ${contactId}: ${howickUser.email}`);
            return howickUser._id;
        }
        
        // If no howickltd.com user found, return the first one
        console.log(`Multiple SecurityUsers found for contact ${contactId}, using first one: ${securityUsers[0].email}`);
        return securityUsers[0]._id;
        
    } catch (error) {
        console.error(`Error finding SecurityUser for contact ${contactId}:`, error);
        return null;
    }
};

// Migrate Ticket collection using native MongoDB operations
const migrateTickets = async () => {
    console.log('Starting Ticket migration...');
    
    try {
        // Get the native MongoDB collection
        const ticketsCollection = mongoose.connection.collection('Tickets');
        
        // Find all tickets that have old structure using native MongoDB
        const tickets = await ticketsCollection.find({
            $or: [
                { reporter: { $exists: true }, old_reporter: { $exists: false } },
                { assignee: { $exists: true }, old_assignee: { $exists: false } }
            ]
        }).toArray();
        
        console.log(`Found ${tickets.length} tickets to migrate`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const ticket of tickets) {
            try {
                const updateData = {};
                const unsetData = {};
                
                // Handle reporter migration
                if (ticket.reporter && !ticket.old_reporter) {
                    const newReporterId = await findSecurityUserForContact(ticket.reporter);
                    if (newReporterId) {
                        updateData.old_reporter = ticket.reporter;
                        updateData.reporter = newReporterId;
                    } else {
                        console.log(`Could not find SecurityUser for reporter in ticket ${ticket._id}`);
                    }
                }
                
                // Handle assignee migration (convert to assignees array)
                if (ticket.assignee && !ticket.old_assignee) {
                    const newAssigneeId = await findSecurityUserForContact(ticket.assignee);
                    if (newAssigneeId) {
                        updateData.old_assignee = ticket.assignee;
                        updateData.assignees = [newAssigneeId];
                        unsetData.assignee = 1; // Remove old assignee field
                    } else {
                        console.log(`Could not find SecurityUser for assignee in ticket ${ticket._id}`);
                    }
                }
                
                // Update the ticket if we have changes
                if (Object.keys(updateData).length > 0) {
                    const updateQuery = { $set: updateData };
                    if (Object.keys(unsetData).length > 0) {
                        updateQuery.$unset = unsetData;
                    }
                    
                    await ticketsCollection.updateOne(
                        { _id: ticket._id },
                        updateQuery
                    );
                    
                    successCount++;
                    console.log(`Successfully migrated ticket ${ticket._id}`);
                } else {
                    console.log(`No changes needed for ticket ${ticket._id}`);
                }
                
            } catch (error) {
                console.error(`Error migrating ticket ${ticket._id}:`, error);
                errorCount++;
            }
        }
        
        console.log(`Ticket migration completed. Success: ${successCount}, Errors: ${errorCount}`);
        
    } catch (error) {
        console.error('Error in ticket migration:', error);
    }
};

// Migrate TicketChangeHistory collection using native MongoDB operations
const migrateTicketChangeHistory = async () => {
    console.log('Starting TicketChangeHistory migration...');
    
    try {
        // Get the native MongoDB collection
        const changeHistoryCollection = mongoose.connection.collection('TicketChangeHistories');
        
        // Find all change history records that need migration using native MongoDB
        const changeHistories = await changeHistoryCollection.find({
            $or: [
                { previousReporter: { $exists: true }, old_previousReporter: { $exists: false } },
                { newReporter: { $exists: true }, old_newReporter: { $exists: false } },
                { previousAssignee: { $exists: true }, old_previousAssignee: { $exists: false } },
                { newAssignee: { $exists: true }, old_newAssignee: { $exists: false } }
            ]
        }).toArray();
        
        console.log(`Found ${changeHistories.length} change history records to migrate`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const history of changeHistories) {
            try {
                const updateData = {};
                const unsetData = {};
                
                // Handle previousReporter
                if (history.previousReporter && !history.old_previousReporter) {
                    const newPreviousReporterId = await findSecurityUserForContact(history.previousReporter);
                    if (newPreviousReporterId) {
                        updateData.old_previousReporter = history.previousReporter;
                        updateData.previousReporter = newPreviousReporterId;
                    }
                }
                
                // Handle newReporter
                if (history.newReporter && !history.old_newReporter) {
                    const newNewReporterId = await findSecurityUserForContact(history.newReporter);
                    if (newNewReporterId) {
                        updateData.old_newReporter = history.newReporter;
                        updateData.newReporter = newNewReporterId;
                    }
                }
                
                // Handle previousAssignee (convert to previousAssignees array)
                if (history.previousAssignee && !history.old_previousAssignee) {
                    const newPreviousAssigneeId = await findSecurityUserForContact(history.previousAssignee);
                    if (newPreviousAssigneeId) {
                        updateData.old_previousAssignee = history.previousAssignee;
                        updateData.previousAssignees = [newPreviousAssigneeId];
                        unsetData.previousAssignee = 1;
                    }
                }
                
                // Handle newAssignee (convert to newAssignees array)
                if (history.newAssignee && !history.old_newAssignee) {
                    const newNewAssigneeId = await findSecurityUserForContact(history.newAssignee);
                    if (newNewAssigneeId) {
                        updateData.old_newAssignee = history.newAssignee;
                        updateData.newAssignees = [newNewAssigneeId];
                        unsetData.newAssignee = 1;
                    }
                }
                
                // Update the change history record if we have changes
                if (Object.keys(updateData).length > 0) {
                    const updateQuery = { $set: updateData };
                    if (Object.keys(unsetData).length > 0) {
                        updateQuery.$unset = unsetData;
                    }
                    
                    await changeHistoryCollection.updateOne(
                        { _id: history._id },
                        updateQuery
                    );
                    
                    successCount++;
                    console.log(`Successfully migrated change history ${history._id}`);
                } else {
                    console.log(`No changes needed for change history ${history._id}`);
                }
                
            } catch (error) {
                console.error(`Error migrating change history ${history._id}:`, error);
                errorCount++;
            }
        }
        
        console.log(`TicketChangeHistory migration completed. Success: ${successCount}, Errors: ${errorCount}`);
        
    } catch (error) {
        console.error('Error in change history migration:', error);
    }
};

// Main migration function
const runMigration = async () => {
    console.log('Starting migration from CustomerContact to SecurityUser...');
    
    try {
        await connectDB();
        
        // Run migrations
        await migrateTickets();
        await migrateTicketChangeHistory();
        
        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
};

// Rollback function using native MongoDB operations
const rollbackMigration = async () => {
    console.log('Starting rollback migration...');
    
    try {
        await connectDB();
        
        // Get native collections
        const ticketsCollection = mongoose.connection.collection('Tickets');
        const changeHistoryCollection = mongoose.connection.collection('TicketChangeHistories');
        
        // Rollback Tickets
        const tickets = await ticketsCollection.find({
            $or: [
                { old_reporter: { $exists: true } },
                { old_assignee: { $exists: true } }
            ]
        }).toArray();
        
        for (const ticket of tickets) {
            const updateData = {};
            const unsetData = {};
            
            if (ticket.old_reporter) {
                updateData.reporter = ticket.old_reporter;
                unsetData.old_reporter = 1;
            }
            
            if (ticket.old_assignee) {
                updateData.assignee = ticket.old_assignee;
                unsetData.old_assignee = 1;
                unsetData.assignees = 1;
            }
            
            if (Object.keys(updateData).length > 0) {
                await ticketsCollection.updateOne(
                    { _id: ticket._id },
                    { $set: updateData, $unset: unsetData }
                );
            }
        }
        
        // Rollback TicketChangeHistory
        const changeHistories = await changeHistoryCollection.find({
            $or: [
                { old_previousReporter: { $exists: true } },
                { old_newReporter: { $exists: true } },
                { old_previousAssignee: { $exists: true } },
                { old_newAssignee: { $exists: true } }
            ]
        }).toArray();
        
        for (const history of changeHistories) {
            const updateData = {};
            const unsetData = {};
            
            if (history.old_previousReporter) {
                updateData.previousReporter = history.old_previousReporter;
                unsetData.old_previousReporter = 1;
            }
            
            if (history.old_newReporter) {
                updateData.newReporter = history.old_newReporter;
                unsetData.old_newReporter = 1;
            }
            
            if (history.old_previousAssignee) {
                updateData.previousAssignee = history.old_previousAssignee;
                unsetData.old_previousAssignee = 1;
                unsetData.previousAssignees = 1;
            }
            
            if (history.old_newAssignee) {
                updateData.newAssignee = history.old_newAssignee;
                unsetData.old_newAssignee = 1;
                unsetData.newAssignees = 1;
            }
            
            if (Object.keys(updateData).length > 0) {
                await changeHistoryCollection.updateOne(
                    { _id: history._id },
                    { $set: updateData, $unset: unsetData }
                );
            }
        }
        
        console.log('Rollback completed successfully!');
        
    } catch (error) {
        console.error('Rollback failed:', error);
    } finally {
        await mongoose.connection.close();
    }
};

// Export functions for use
module.exports = {
    runMigration,
    rollbackMigration,
    migrateTickets,
    migrateTicketChangeHistory
};

// Run migration if this file is executed directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--rollback')) {
        rollbackMigration();
    } else {
        runMigration();
    }
}
