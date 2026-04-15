import { jest } from "@jest/globals";
import {
    mockChildProcess,
    emitStdoutData,
    emitStderrData,
    emitClose,
    expectCommandToBe,
    resetMockChildProcess,
} from "./childProcess.mock";

const { spawn, assertZeroCode, exec, execSfGetJson } = await import("../executors");
const childProcess = await import("node:child_process");

describe("spawn", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetMockChildProcess();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it("should return exit code and empty output when returnOutput is false", async () => {
        const command = `echo test`;

        const resultPromise = spawn(command, false, false);
        emitClose(0);
        const result = await resultPromise;

        expect(result).toEqual({ exitCode: 0 });
        expect(result.stdout).toBeUndefined();
        expect(result.stderr).toBeUndefined();
    });

    it("should capture stdout when returnOutput is true", async () => {
        const testOutput = "test output";
        const command = `echo ${testOutput}`;

        const resultPromise = spawn(command, true, false);
        emitStdoutData(testOutput);
        emitClose(0);
        const { exitCode, stdout } = await resultPromise;

        expect(exitCode).toBe(0);
        expect(stdout).toBe(testOutput);
    });

    it("should capture stderr on command failure", async () => {
        const errorMessage = "command error";
        const command = `failing-command`;

        const resultPromise = spawn(command, true, false);
        emitStderrData(errorMessage);
        emitClose(1);
        const { exitCode, stderr } = await resultPromise;

        expect(exitCode).toBe(1);
        expect(stderr).toBe(errorMessage);
    });

    it("should handle non-zero exit code", async () => {
        const command = `exit 127`;

        const resultPromise = spawn(command, true, false);
        emitStderrData("command not found");
        emitClose(127);
        const { exitCode, stderr } = await resultPromise;

        expect(exitCode).toBe(127);
        expect(stderr).toBe("command not found");
    });

    it("should pipe stdout and stderr when print is true", async () => {
        const command = `echo test`;

        const resultPromise = spawn(command, false, true);
        emitClose(0);
        await resultPromise;

        expect(mockChildProcess.stdout.pipe).toHaveBeenCalled();
        expect(mockChildProcess.stderr.pipe).toHaveBeenCalled();
    });

    it("should verify spawn was called with correct arguments", async () => {
        const command = `test-command`;

        const resultPromise = spawn(command, false, false);
        emitClose(0);
        await resultPromise;

        expect(childProcess.spawn).toHaveBeenCalledWith(command, { shell: true, stdio: "pipe" });
    });
});

describe("assertZeroCode", () => {
    beforeEach(() => {
        resetMockChildProcess();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it("should not throw when exit code is zero", async () => {
        const result = { exitCode: 0 };
        await expect(assertZeroCode(result)).resolves.not.toThrow();
    });

    it("should throw when exit code is non-zero", async () => {
        const result = { exitCode: 1 };
        await expect(assertZeroCode(result)).rejects.toThrow("Command returned non-zero exit code: 1");
    });
});

describe("exec", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetMockChildProcess();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it("should execute command and return result when exit code is zero", async () => {
        const testOutput = "success output";
        const command = `echo success`;

        const resultPromise = exec(command, true, false);
        emitStdoutData(testOutput);
        emitClose(0);
        const { exitCode, stdout } = await resultPromise;

        expect(exitCode).toBe(0);
        expect(stdout).toBe(testOutput);
    });

    it("should throw when command fails", async () => {
        const command = `exit 1`;

        const resultPromise = exec(command, false, false);
        emitClose(1);

        await expect(resultPromise).rejects.toThrow("Command returned non-zero exit code: 1");
    });

    it("should use default parameters when not provided", async () => {
        const command = `echo test`;

        const resultPromise = exec(command);
        emitClose(0);
        const result = await resultPromise;

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toBeUndefined();
    });
});

describe("execSfGetJson", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetMockChildProcess();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    it("should parse JSON output from SF command", async () => {
        const command = "sf org list";
        const jsonOutput = { status: 0, result: { orgs: ["org1", "org2"] } };

        const resultPromise = execSfGetJson(command, false);
        emitStdoutData(JSON.stringify(jsonOutput));
        emitClose(0);
        const result = await resultPromise;

        expectCommandToBe("sf org list --json");
        expect(result).toEqual(jsonOutput);
    });

    it("should return -1 code when stdout is empty", async () => {
        const command = "sf org list";

        const resultPromise = execSfGetJson(command, false);
        emitClose(0);
        const result = (await resultPromise) as { exitCode: number };

        expectCommandToBe("sf org list --json");
        expect(result.exitCode).toBe(-1);
    });

    it("should handle complex JSON objects", async () => {
        const command = "sf data query";
        const jsonOutput = {
            status: 0,
            result: {
                records: [
                    { Id: "001", Name: "Test1" },
                    { Id: "002", Name: "Test2" },
                ],
                totalSize: 2,
            },
        };

        const resultPromise = execSfGetJson(command, false);
        emitStdoutData(JSON.stringify(jsonOutput));
        emitClose(0);
        const result = await resultPromise;

        expectCommandToBe("sf data query --json");
        expect(result).toEqual(jsonOutput);
    });
});
