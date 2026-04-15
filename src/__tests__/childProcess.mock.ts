import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { Buffer } from "node:buffer";

interface MockChildProcess extends EventEmitter {
    stdout: EventEmitter & { pipe: jest.Mock };
    stderr: EventEmitter & { pipe: jest.Mock };
}

export const mockChildProcess = new EventEmitter() as MockChildProcess;
mockChildProcess.stdout = Object.assign(new EventEmitter(), { pipe: jest.fn() });
mockChildProcess.stderr = Object.assign(new EventEmitter(), { pipe: jest.fn() });

export const resetMockChildProcess = () => {
    mockChildProcess.removeAllListeners();
    mockChildProcess.stdout.removeAllListeners();
    mockChildProcess.stderr.removeAllListeners();
    mockChildProcess.stdout.pipe = jest.fn();
    mockChildProcess.stderr.pipe = jest.fn();
};

jest.unstable_mockModule("node:child_process", () => ({
    spawn: jest.fn(() => mockChildProcess),
}));

const { spawn } = await import("node:child_process");

const emitData = (stream: EventEmitter, dataString: string) => {
    stream.emit("data", Buffer.from(dataString));
};

export const emitStdoutData = (dataString: string) => {
    emitData(mockChildProcess.stdout, dataString);
};

export const emitStderrData = (dataString: string) => {
    emitData(mockChildProcess.stderr, dataString);
};

export const emitClose = (code: number) => {
    mockChildProcess.emit("close", code);
};

export const expectCommandToBe = (expectedCommand: string) => {
    expect(spawn).toHaveBeenCalledWith(expectedCommand, { shell: true, stdio: "pipe" });
};

export const expectThrowError = async (promise: Promise<unknown>, expectedMessage: string) => {
    await expect(promise).rejects.toThrow(expectedMessage);
};
