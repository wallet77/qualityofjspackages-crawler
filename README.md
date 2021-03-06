# Quality of JS packages - crawler

## Purpose

This project aims to crawl the top most famous Javascript packages and run some analysis on them.  
Here is the current workflow:
- download the list of the most dependend packages
- for each of them
    * request npm registry to retrieve global information
    * git clone the project from github
    * run [scaphandre](https://github.com/hubblo-org/scaphandre)
    * install dependencies
    * stop scaphandre
    * run [Qualscan](https://github.com/wallet77/qualscan)
    * request [npms.io](https://www.npms.io) to get more data

## Project setup
```
npm install
```

## run
```
SCAPHANDRE_BIN=/pathTo/scaphandre node index.js
```

### Permissions

If the program stop at the step `Installing dependencies ...` without error message.
Or if you get some error message related to scaphandre, then you should run this 2 commands:

```bash
chmod 775 /usr/local/bin/scaphandre
chmod a+s /usr/local/bin/scaphandre
```

## run with docker

```bash
docker build -t packages-quality-report .
```

```bash
docker run -v /sys/class/powercap:/sys/class/powercap -v /proc:/proc -ti packages-quality-report
```

## Lints and fixes files
```
npm run linter
```
