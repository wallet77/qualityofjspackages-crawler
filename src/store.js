const logger = require('pino')()
const fs = require('fs')
const path = require('path')

module.exports = {
    save: async (report) => {
        try {
            await fs.promises.writeFile(path.join('./', 'report.json'), JSON.stringify(report), 'utf8')
        } catch (err) {
            logger.error(err)
        }
    }
}
