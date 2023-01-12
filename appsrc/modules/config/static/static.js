module.exports = {
    recordDelMessage(results) {
        if(results != undefined && results.deletedCount > 0) {
            return results.deletedCount+" records successfully deleted!"
        } else {
            return "No records deleted!";
        }
    }
};