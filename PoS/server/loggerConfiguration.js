import winston from "winston";
export const logConf = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.splat(), winston.format.colorize(), winston.format.simple()),
    meta: false,
    msg: "HTTP  ",
    expressFormat: true,
    colorize: false,
    ignoreRoute: () => false,
};
