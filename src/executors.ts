import process from "node:process";
import { spawn as spawnChildProcess } from "node:child_process";
import { Buffer } from "node:buffer";

export interface SpawnResult {
    exitCode: number | null;
    stdout?: string;
    stderr?: string;
}

export const spawn = (command: string, returnOutput: boolean, print: boolean): Promise<SpawnResult> => {
    const childProcess = spawnChildProcess(command, { shell: true, stdio: "pipe" });
    if (print) {
        console.log("[PROGRESS] Spawned:", command);
        childProcess.stdout?.pipe(process.stdout);
        childProcess.stderr?.pipe(process.stderr);
    }

    return new Promise((resolve, reject) => {
        childProcess.on("error", reject);

        if (returnOutput) {
            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];

            childProcess.stdout?.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
            childProcess.stderr?.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

            childProcess.on("close", (exitCode: number | null) => {
                resolve({
                    exitCode,
                    stdout: Buffer.concat(stdoutChunks).toString(),
                    stderr: Buffer.concat(stderrChunks).toString(),
                });
            });
        } else {
            childProcess.on("close", (exitCode: number | null) => resolve({ exitCode }));
        }
    });
};

export const assertZeroCode = async ({ exitCode, stderr, stdout }: SpawnResult): Promise<void> => {
    if (exitCode !== 0) {
        const message = [stderr, stdout].filter(Boolean).join("\n");
        console.error("[ERROR] Command failed with message:", message);
        const errorDetails = message ? `\nDetails: ${message}` : "";
        throw new Error(`Command returned non-zero exit code: ${exitCode}${errorDetails}`);
    }
};

export const exec = async (command: string, returnOutput = false, print = true): Promise<SpawnResult> => {
    const result = await spawn(command, returnOutput, print);
    await assertZeroCode(result);
    return result;
};

export const execSfGetJson = async (command: string, print = false): Promise<SpawnResult> => {
    const result = await spawn(`${command} --json`, true, print);
    return JSON.parse(result.stdout || '{ "exitCode": -1 }') as SpawnResult;
};
