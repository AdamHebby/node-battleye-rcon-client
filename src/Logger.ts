import winston, { createLogger } from 'winston';
import { LoggerOptions, errorLogger, logger } from 'express-winston';
import { ErrorRequestHandler, Handler, Request, Response } from 'express';
import { NartConfig } from './NartConfig';

class Logger
{
    private static normalLoggerInstances: Map<string, winston.Logger> = new Map();

    public static normalLogger(path: string = 'nart.log'): winston.Logger
    {
        if (this.normalLoggerInstances.has(path)) {
            return this.normalLoggerInstances.get(path) as winston.Logger;
        }

        let format = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf((info) => {
                return `[${info.timestamp}] ${info.level}: ${info.message}`;
            })
        );

        let logger = createLogger({
            format: format,
            transports: this.commonTransports(path, [format]),
            level: NartConfig.config().logging.level
        });

        this.normalLoggerInstances.set(path, logger);

        return logger;
    }

    public static winstonHttpLogger(): Handler
    {
        return logger(this.config('nart.log'));
    }

    public static winstonHttpErrorLogger(): ErrorRequestHandler
    {
        return errorLogger(this.config('nart.error.log'));
    }

    private static config(path: string): LoggerOptions
    {
        let format = winston.format.combine(
            winston.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            winston.format.printf((info) => {
                let resTime = info.meta.responseTime.toString().padStart(4, ' ');

                return `[${info.timestamp}] ${info.level}: ${resTime}ms ${info.meta.res.statusCode} ${info.message}`;
            })
        );

        return {
            format: format,
            transports: this.commonTransports(path, [format]),
            colorize: false,
            level: NartConfig.config().logging.level,
            meta: true,
            ignoreRoute: (req: Request, _: Response): boolean => {
                return req.url.startsWith('/resources') === true;
            }
        };
    }

    private static commonTransports(filename: string, formats: winston.Logform.Format[]): winston.transport[]
    {
        let logPath = NartConfig.config().logging.path;
        return [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    ...formats
                )
            }),
            new winston.transports.File({
                filename: `${logPath}/${filename}`,
                format: winston.format.combine(
                    ...formats
                )
            })
        ];
    }
}

export { Logger };
