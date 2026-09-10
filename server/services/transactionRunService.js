const mongoose = require('mongoose');

exports.transactionRunService = async (operationsAsAFunction) => {
    const session = await mongoose.startSession();

    try {
        let result;
        await session.withTransaction(async () => {
            result = await operationsAsAFunction(session);
        })

        return result;
    } catch (error) {
        console.error('Transaction failed and was rolled back:', error.message);
        throw error;
    } finally {
        await session.endSession();
    }
}