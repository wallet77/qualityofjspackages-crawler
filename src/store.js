const MongoClient = require('mongodb').MongoClient
const logger = require('pino')()

// Connection URL
const url = process.env.MONGO_URL || 'mongodb://localhost:27017'

// Database Name
const dbName = 'npm-packages-quality-analysis'

let client
let reportsCollection

const insertReports = async (report) => {
    // Insert some reports
    const result = await reportsCollection.insertMany([report])
    return result
}

const connection = async () => {
    client = await MongoClient.connect(url)
    const db = client.db(dbName)
    reportsCollection = db.collection('reports')
}

module.exports = {
    save: async (report) => {
        let res
        try {
            await connection()
            res = await insertReports(report)
            client.close()
        } catch (err) {
            logger.error(err)
        }

        client.close()
        return res
    }
}
