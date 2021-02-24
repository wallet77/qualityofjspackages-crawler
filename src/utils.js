const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')
const spawn = childProcess.spawn
const logger = require('pino')()
const qualscan = require('qualscan')

const avg = (arr) => {
    let sum = arr[0]
    for (let i = 1; i < arr.length; i++) {
        sum = sum + arr[i]
    }
    return sum / arr.length
}

const execCommand = (cmd, options) => {
    return new Promise((resolve, reject) => {
        const child = childProcess.exec(cmd, options, (err, stdout) => {
            if (err) {
                return reject(err)
            }
            return resolve({ data: stdout, pid: child.pid })
        })
    })
}

const cloneRepo = async (repository) => {
    logger.info(`Cloning ${repository}`)
    const msg = `Clone ${repository}`
    try {
        await execCommand(`git clone ${repository}`, {
            cwd: path.join(process.cwd(), 'repos')
        })
    } catch (err) {
        logger.error(`${msg} => error`)
        logger.error(err)
    }
}

const startComputeEnergicalComsuption = (packagePath) => {
    const child = spawn(`${process.env.SCAPHANDRE_BIN}`, ['json', '-t 60', '--step 0', '--step_nano 500000000', '--file report.json'], {
        cwd: path.join(process.cwd(), 'repos', packagePath),
        shell: true
    })

    return child
}

const stopComputeEnergicalComsuption = (packagePath, child, PID) => {
    return new Promise((resolve) => {
        child.on('exit', () => {
            logger.info('Reading electrical data ...')
            fs.readFile(path.join(process.cwd(), 'repos', packagePath, 'report.json'), (err, rawdata) => {
                if (err) logger.error(err)

                const consumption = {
                    npm: [],
                    host: []
                }

                try {
                    const data = JSON.parse(rawdata)
                    for (let i = 0; i < data.length; i++) {
                        for (let j = 0; j < data[i].consumers.length; j++) {
                            if ((data[i].consumers[j].exe.indexOf('node') > -1 ||
                                data[i].consumers[j].exe.indexOf('npm') > -1)) {
                                consumption.npm.push(data[i].consumers[j].consumption)
                                consumption.host.push(data[i].host)
                            }
                        }
                    }
                } catch (err) {
                    logger.error(err)
                }

                consumption.npm = avg(consumption.npm)
                consumption.host = avg(consumption.host)
                resolve(consumption)
            })
        })
        child.kill('SIGTERM')
    })
}

/**
 * Install project dependencies
 * And collect electrical comsumption
 *
 * @param {String} packagePath : package folder
 */
const installDep = async (packagePath) => {
    const child = startComputeEnergicalComsuption(packagePath)
    logger.info('Installing dependencies ...')
    const res = await execCommand('npm install', {
        cwd: path.join(process.cwd(), 'repos', packagePath)
    })
    return await stopComputeEnergicalComsuption(packagePath, child, res.pid)
}

/**
 * Run Qualscan tool and collect results
 *
 * @param {String} packagePath : package folder
 */
const runQualscan = async (packagePath) => {
    logger.info(`Scanning ${packagePath}`)
    return await qualscan.run({
        reporters: ['json'],
        reportPath: '',
        scripts: []
    }, path.join(process.cwd(), 'repos', packagePath))
}

/**
 * Run before to generate a new report.
 * - clean repos folder
 */
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

module.exports = {
    preRun,
    runQualscan,
    avg,
    cloneRepo,
    installDep,
    execCommand
}
