const { DocumentCategory } = require('../appsrc/modules/documents/models');
const mongoose = require('../appsrc/modules/db/dbConnection');

async function cleanupIndexes() {
	try {
		// Print existing indexes before
		const beforeIndexes = await DocumentCategory.collection.indexes();
		console.log('Before:', beforeIndexes);

		// Drop the old unique index
		await DocumentCategory.collection.dropIndex('name_1');
		console.log('Dropped unique index on name');

		// Recreate as non-unique index
		await DocumentCategory.collection.createIndex({ name: 1 });
		console.log('Recreated non-unique index on name');

		// Print after
		const afterIndexes = await DocumentCategory.collection.indexes();
		console.log('After:', afterIndexes);

		process.exit(0);
	} catch (err) {
		console.error('Error:', err);
		process.exit(1);
	}
}

cleanupIndexes()
