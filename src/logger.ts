export const createLogger = (nameSpace: string) => {
    return {
        info: (message?: any, ...optionalParams: any[]) => {
            console.log(`${nameSpace}:`, message, ...optionalParams, new Date().toISOString());
        },
        warn: (message?: any, ...optionalParams: any[]) => {
            console.warn(`${nameSpace}:`, message, ...optionalParams, new Date().toISOString());
        },
        error: (message?: any, ...optionalParams: any[]) => {
            console.error(`${nameSpace}:`, message, ...optionalParams, new Date().toISOString());
        }
    }
}
