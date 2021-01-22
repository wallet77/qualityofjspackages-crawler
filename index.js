const axios = require('axios')
const logger = require('pino')()
const childProcess = require('child_process')
const path = require('path')
const qualscan = require('qualscan')
const store = require('./src/store')
const { v4: uuidv4 } = require('uuid')
const fs = require('fs')

const cloneRepo = async (repository) => {
    logger.info(`Cloning ${repository}`)
    return new Promise((resolve, reject) => {
        childProcess.exec(`git clone ${repository}`, {
            cwd: path.join(process.cwd(), 'repos')
        }, (err, stdout) => {
            const msg = `Clone ${repository}`
            if (err) {
                logger.error(`${msg} => error`)
                return reject(err)
            }
            return resolve(stdout)
        })
    })
}

const runQualscan = async (packagePath) => {
    logger.info(`Scanning ${packagePath}`)
    return await qualscan.run({
        reporters: ['json'],
        reportPath: '',
        scripts: []
    }, path.join(process.cwd(), 'repos', packagePath))
}

const preRun = async () => {
    try {
        logger.info('Deleting repos folder ...')
        await fs.promises.rmdir(path.join(process.cwd(), 'repos'), { recursive: true })
        logger.info('Creating repos folder ...')
        await fs.promises.mkdir(path.join(process.cwd(), 'repos'))
    } catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

const run = async () => {
    await preRun()
    const id = uuidv4()
    const res = await axios.get('https://gist.githubusercontent.com/anvaka/8e8fa57c7ee1350e3491/raw/b6f3ebeb34c53775eea00b489a0cea2edd9ee49c/01.most-dependent-upon.md')
    const packages = res.data.split('\n')
    const allPackages = {}
    const reposAlreadyCloned = []

    const max = 50 // packages.length
    // extract packages list
    for (let i = 0; i < max; i++) {
        const npmPackage = packages[i]

        const name = npmPackage.substring(
            npmPackage.lastIndexOf('[') + 1,
            npmPackage.lastIndexOf(']')
        )

        if (name !== '') {
            const rank = npmPackage.substring(
                0,
                npmPackage.indexOf('.')
            )

            allPackages[name] = {
                reportId: id,
                name,
                rank,
                qualscan: {}
            }
        }
    }

    const nbPackages = Object.keys(allPackages).length
    let nbPackageAlreadyDone = 0

    for (const name in allPackages) {
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
                final: npmsRes.data.score.final,
                quality: npmsRes.data.score.detail.quality
            }

            // -----------------------------
            // CLONE REPO
            // -----------------------------

            // avoid cloning an already existing repo
            // usefull when we get sub packages of a bigger project
            // example: react-dom for react
            if (reposAlreadyCloned.indexOf(repository) === -1) {
                await cloneRepo(repository)
                reposAlreadyCloned.push(repository)
            } else {
                logger.info(`${repository} is already cloned!`)
            }

            // -----------------------------
            // QUALSCAN
            // -----------------------------
            const report = await runQualscan(path.join(repoName, repositoryDirectory))
            currentPackage.qualscan = JSON.stringify(report)
        } catch (err) {
            logger.error(err)
        }
        nbPackageAlreadyDone++
        logger.info(`${Math.round(nbPackageAlreadyDone * 100 / nbPackages)}%`)
    }

    // -----------------------------
    // STORE REPORT
    // -----------------------------
    logger.info('Saving report ...')
    await store.save(allPackages)
    logger.info('Report saved!')
}

run()
