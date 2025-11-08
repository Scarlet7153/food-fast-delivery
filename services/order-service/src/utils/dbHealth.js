const mongoose = require('mongoose');

const checkDBResponseTime = async () => {
const start = Date.now();

try {
    // Try a simple operation
    await mongoose.connection.db.admin().ping();
    return Date.now() - start;
} catch (error) {
    throw new Error(`Database ping failed: ${error.message}`);
}
};

module.exports = checkDBResponseTime;