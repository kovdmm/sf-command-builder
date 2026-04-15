import { exec, execSfGetJson } from "./executors.js";

/**
 * @import { SfCommandBuilder } from "./sf.js"
 * @type {SfCommandBuilder}
 */

/**
 * 
 * @param {*} obj 
 * @returns 
 */
const copy = (obj) => {
    const objCopy = () => {};
    objCopy.$commands = [...obj.$commands];
    objCopy.$flag = obj.$flag;
    objCopy.toString = obj.toString;
    objCopy.exec = obj.exec;
    return objCopy;
};

/**
 * Processes method call arguments to build the command string. 
 * If the method is called with valid arguments, they are added to the command. 
 * If the method is called without arguments or with only null/undefined arguments, 
 * the flag will be added without arguments. If there are no valid arguments 
 * and the command has more than one part, the recently added flag will be removed to avoid 
 * adding a flag without arguments.
 * @param {*} target - the target object being proxied
 * @param {any[]} argumentsList - the list of arguments passed to the method call
 * @returns {typeof base} - a new proxy instance with the updated command
 */
const processArguments = (target, argumentsList) => {
    if (argumentsList.length) {
        const validArguments = argumentsList.filter((arg) => arg !== undefined && arg !== null);
        if (validArguments.length) {
            target.$commands.push(validArguments.map(String).join(","));
        } else if (target.$commands.length > 1) {
            target.$commands.pop(); // remove recently added flag if no valid arguments
        }
    }
    return target;
};

const handler = {
    /**
     * Intercepts method calls on the proxy to build the command string. Each method call is treated as a flag with its arguments.
     * If the method is called without arguments or with only null/undefined arguments, the flag will be added without arguments.
     * @param {*} target - the target object being proxied
     * @param {*} _ - the thisArg (not used in this context)
     * @param {any[]} argumentsList - the list of arguments passed to the method call
     * @returns {typeof base} - a new proxy instance with the updated command
     */
    apply: (target, _, argumentsList) => {
        const targetCopy = copy(target);
        return new Proxy(processArguments(targetCopy, argumentsList), handler);
    },
    /**
     * Intercepts property access on the proxy to build the command string. Each property access is treated as a subcommand.
     * @param {SfCommandBuilder} target - the target object being proxied
     * @param {*} prop - the property being accessed
     * @returns {typeof base} - a new proxy instance with the updated command
     */
    get: (target, prop) => {
        if (Reflect.has(target, prop) || prop === "$flag") {
            return Reflect.get(target, prop);
        }
        const targetCopy = copy(target);
        const formattedArg = prop.replace(/([A-Z])|_/g, "-$1").toLowerCase();
        targetCopy.$commands.push(formattedArg);
        return new Proxy(targetCopy, handler);
    },
};

const base = () => {};
/**
 * Initial command in the builder, starts with "sf" for Salesforce CLI commands. Each subsequent property access
 * or method call builds upon this base command.
 * @type {readonly string[]}
 */
base.$commands = ["sf"];
/**
 * Adds a flag with its arguments to the command. If arguments list is empty or contains only null/undefined values,
 * the flag will be added without arguments.
 * @param {keyof SfCommandBuilder} flag - the flag to be added to the command (e.g. "--wait")
 * @param  {...any} argumentsList - the arguments to be added to the flag (e.g. 120 for "--wait 120")
 * @returns {SfCommandBuilder} - a new proxy instance with the updated command
 */
base.$flag = function (flag, ...argumentsList) {
    // @ts-ignore - dynamic property access handled by Proxy
    return this[flag](...argumentsList);
};
/**
 * Converts the built command into a string format that can be executed in the shell.
 * @returns {string} - the complete command as a string
 */
base.toString = function () {
    return this.$commands.join(" ");
};
/**
 * Executes the built command using `exec` or `execSfGetJson` function from executors module based on asJson flag.
 * @param {boolean} asJson - whether to parse command output as JSON (appending `--json` flag to the command)
 * @returns {Promise<{ exitCode: number, stdout?: string, stderr?: string }>} - command execution result
 */
base.exec = function (asJson = false) {
    const command = this.toString();
    return asJson ? execSfGetJson(command) : exec(command);
};

/**
 * Salesforce CLI command builder.
 *
 * This proxy-based builder allows you to construct Salesforce CLI (sf) commands.
 * 
 * @type {SfCommandBuilder}
 *
 * @example
 * ```javascript
 * import { sf } from "./sf.js";
 *
 * console.log(sf.help.toString()); // "sf help"
 * console.log(sf.org.list.toString()); // "sf org list"
 * console.log(sf.org.login.web.__setDefault("true").toString()); // "sf org login web --set-default true"
 * console.log(sf.org.login.web.$flag("--set-default").toString()); // "sf org login web --set-default"
 * console.log(sf.project.deploy.start.__wait(10).toString()); // "sf project deploy start --wait 10"
 * console.log(sf.project.deploy.start.$flag("--wait", 10).toString()); // "sf project deploy start --wait 10"
 * ```
 */
export const sf = new Proxy(base, handler);
