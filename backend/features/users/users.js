const dbConnection = require('../../connection-pool/dbConnection');

async function createOrUpdateUser(profile) {
    const connection = await dbConnection.getConnection();

    await connection.db().collection('Users').updateOne(
        {
            googleId: profile.id
        },
        {
            $set: {
                name: profile.displayName,
                email: profile.email
            }
        },
        {
            upsert: true
        }
    );
}

module.exports = {
    createOrUpdateUser
};
