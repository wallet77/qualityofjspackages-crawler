const axios = require('axios')
const logger = require('pino')()
const path = require('path')
const os = require('os')
const store = require('./src/store')
const { v4: uuidv4 } = require('uuid')
const utils = require('./src/utils')
const fs = require('fs')

/**
 * Entrypoint
 */
const run = async () => {
    await utils.preRun()

    const globalTime = process.hrtime()
    const id = uuidv4()

    const rawdata = await fs.promises.readFile(process.env.LIST_PACKAGES_FILE || path.join(__dirname, './report/input.json'))
    const allPackages = JSON.parse(rawdata)

    const reposAlreadyCloned = []

    const nbPackages = Object.keys(allPackages).length
    let nbPackageAlreadyDone = 0
    const skippedPackages = {}

    for (const name in allPackages) {
        const time = process.hrtime()
        const currentPackage = allPackages[name]
        try {
            // -----------------------------
            // NPM
            // -----------------------------
            const res = await axios.get(`https://registry.npmjs.org/${name}`)

            let repository = res.data.repository
            let repositoryDirectory = ''
            if (typeof res.data.repository === 'object') {
                repository = res.data.repository.url
                repositoryDirectory = res.data.repository.directory ? res.data.repository.directory : repositoryDirectory
            }

            // hack when repo is in fact a branch
            if (repository.indexOf('/tree/master') > -1) {
                repositoryDirectory = repository.substring(repository.indexOf('/tree/master/') + 13)
                repository = repository.substring(0, repository.indexOf('/tree/master/'))
            }

            repository = repository.replace(/git\+/i, '')
            repository = repository.replace(/\.git/i, '')

            const repoName = repository.substring(repository.lastIndexOf('/') + 1) // little hack in case package's name is not the same as repo's name

            // -----------------------------
            // NPMS
            // -----------------------------
            const npmsRes = await axios.get(`https://api.npms.io/v2/package/${encodeURIComponent(name)}`)
            currentPackage.npms = {
                score: npmsRes.data.score,
                evaluation: npmsRes.data.evaluation
            }
            // -----------------------------
            // CLONE REPO
            // -----------------------------

            // avoid cloning an already existing repo
            // usefull when we get sub packages of a bigger project
            // example: react-dom for react
            if (reposAlreadyCloned.indexOf(repository) === -1) {
                await utils.cloneRepo(repository)
                reposAlreadyCloned.push(repository)
            } else {
                logger.info(`${repository} is already cloned!`)
            }

            const repoPath = path.join(repoName, repositoryDirectory)

            // -----------------------------
            // Install dependencies
            // -----------------------------
            const installRes = await utils.installDep(repoPath)
            currentPackage.consumption = installRes

            // -----------------------------
            // QUALSCAN
            // -----------------------------
            const report = await utils.runQualscan(repoPath)
            currentPackage.qualscan = JSON.stringify(report)
        } catch (err) {
            skippedPackages[name] = err
        }
        const diff = process.hrtime(time)
        currentPackage.time = diff[0] * 1e9 + diff[1]
        nbPackageAlreadyDone++
        logger.info(`${Math.round(nbPackageAlreadyDone * 100 / nbPackages)}%`)
    }

    const packagesInError = Object.keys(skippedPackages)
    if (packagesInError.length > 0) {
        logger.error(`${packagesInError.length} packages skipped due to errors.`)
        logger.error(packagesInError.join('\n'))
    }

    const diff = process.hrtime(globalTime)
    // -----------------------------
    // STORE REPORT
    // -----------------------------
    logger.info('Saving report ...')
    await store.save({
        id: id,
        time: new Date().getTime(),
        duration: diff[0] * 1e9 + diff[1],
        packages: allPackages,
        machine: {
            cpu: {
                number: os.cpus().length,
                type: {
                    model: os.cpus()[0].model,
                    speed: os.cpus()[0].speed
                }
            },
            os: {
                platform: os.platform(),
                release: os.release(),
                version: os.version()
            },
            memory: {
                total: os.totalmem()
            }
        },
        skippedPackages
    })
    logger.info('Report saved!')
}

run()
