import chalk from "chalk";
export const logger = {
    info(message) {
        console.log(message);
    },
    warn(message) {
        console.warn(chalk.yellow(message));
    },
    error(message) {
        console.error(chalk.red(message));
    },
    success(message) {
        console.log(chalk.green(message));
    }
};
//# sourceMappingURL=logger.js.map