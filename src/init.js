'use strict';

const config = require('../config.json');
const fs = require('fs');

module.exports = {
    run() {
        if (!fs.existsSync(config.logs.dir)) {
            fs.mkdirSync(config.logs.dir, { recursive: true });
        }

        const dayjs = require('dayjs');
        const getCurrentTime = () => `${dayjs().format('YYYY-MM-DD hh:mm:ss.SSS A')}`;
        const getLogFilename = () => `${dayjs().format('YYYY-MM-DD_hh-mm-ss_A')}.log`;

        const winston = require('winston');
        const wlogger = winston.createLogger({
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: `${config.logs.dir}/${getLogFilename()}` }),
            ],
            format: winston.format.printf(log => `[${getCurrentTime()}] [${log.level.toUpperCase()}] ${log.message}`),
        });

        const logger = (level, args) => {
            if (args.length === 0) return;
            let res = '';
            for (let i = 0; i < args.length; i++) {
                if (i > 0) {
                    res += ' ';
                }
                if (typeof args[i] === 'object') {
                    res += JSON.stringify(args[i], null, 4);
                } else {
                    res += args[i];
                }
            }

            wlogger.log(level, res);
        };

        console.log = function log(...args) {
            logger('info', args);
        };
        /**
         * @param {Error} err
         */
        console.error = function error(...args) {
            const arr = [...args];
            const err = arr.shift();
            logger('error', [err.name, err.message, err.stack, ...arr]);
        };

        if (process.argv.length > 2 && process.argv[2] === '--production') {
            process.env.BOT_TOKEN = process.env.PROD_TOKEN;
            process.env.CLIENT_ID = process.env.PROD_CLIENT_ID;
        } else {
            process.env.BOT_TOKEN = process.env.DEV_TOKEN;
            process.env.CLIENT_ID = process.env.DEV_CLIENT_ID;
        }
    },
};
