module.exports = {
    delete: {
        desc: 'Record deleted successfully!',
        Code: 200
    },
    deleted: {
        desc: 'Records deleted successfully!',
        Code: 200
    },
    deletedNon: {
        desc: 'No records deleted!',
        Code: 200
    },
    addedRecord: {
        desc: 'Record added successfully!',
        Code: 200
    },
    deleteMsg(results) {
        if(results != undefined) {
            return results.deletedCount == 1 ? this.delete.desc : results.deletedCount > 1 ? this.deleted.desc : this.deletedNon.desc;
        }
    }
};