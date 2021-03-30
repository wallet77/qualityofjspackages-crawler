const exporter = require(`./${process.env.EXPORTER || 'npm'}.exporter.js`)
const fs = require('fs')
const path = require('path');

(async () => {
    let res = {}
    try {
        res = await exporter()

        console.log('Done')
    } catch (err) {
        console.log(err)
    }

    await fs.promises.writeFile(process.env.OUTPUT_FILE || path.join(__dirname, '../report/input.json'), JSON.stringify(res), 'utf8')
})()
