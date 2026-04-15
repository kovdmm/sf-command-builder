import process from "node:process";
import { spawn as spawnChildProcess } from "node:child_process";
import { Buffer } from "node:buffer";

/**
 * 
 * @param {*} command 
 * @param {*} returnOutput 
 * @param {*} print 
 * @returns 
 */
export const spawn = (command, returnOutput, print) => {
    const childProcess = spawnChildProcess(command, { shell: true, stdio: "pipe" });
    if (print) {
        console.log("[PROGRESS] Spawned:", command);
        childProcess.stdout?.pipe(process.stdout);
        childProcess.stderr?.pipe(process.stderr);
    }

    return new Promise((resolve, reject) => {
        childProcess.on("error", reject);

        if (returnOutput) {
            /** @type {Buffer[]} */
            const stdoutChunks = [];
            /** @type {Buffer[]} */
            const stderrChunks = [];

            childProcess.stdout?.on("data", (chunk) => stdoutChunks.push(chunk));
            childProcess.stderr?.on("data", (chunk) => stderrChunks.push(chunk));

            childProcess.on("close", (exitCode) => {
                resolve({
                    exitCode,
                    stdout: Buffer.concat(stdoutChunks).toString(),
                    stderr: Buffer.concat(stderrChunks).toString(),
                });
            });
        } else {
            childProcess.on("close", (exitCode) => resolve({ exitCode }));
        }
    });
};

/**
 * 
 * @param {{ exitCode: number, stderr?: string, stdout?: string }} param0 
 */
export const assertZeroCode = async ({ exitCode, stderr, stdout }) => {
    if (exitCode !== 0) {
        const message = [stderr, stdout].filter(Boolean).join("\n");
        console.error("[ERROR] Command failed with message:", message);
        const errorDetails = message ? `\nDetails: ${message}` : "";
        throw new Error(`Command returned non-zero exit code: ${exitCode}${errorDetails}`);
    }
};

/**
 * 
 * @param {*} command 
 * @param {*} returnOutput 
 * @param {*} print 
 * @returns 
 */
export const exec = async (command, returnOutput = false, print = true) => {
    const result = await spawn(command, returnOutput, print);
    await assertZeroCode(result);
    return result;
};

/**
 * 
 * @param {*} command 
 * @param {*} print 
 * @returns 
 */
export const execSfGetJson = async (command, print = false) => {
    const result = await spawn(`${command} --json`, true, print);
    return JSON.parse(result.stdout || '{ "exitCode": -1 }');
};
