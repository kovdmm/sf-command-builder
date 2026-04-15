import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { Buffer } from "node:buffer";

export const mockChildProcess = new EventEmitter();
mockChildProcess.stdout = new EventEmitter();
mockChildProcess.stderr = new EventEmitter();
mockChildProcess.stdout.pipe = jest.fn();
mockChildProcess.stderr.pipe = jest.fn();

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

const emitData = (stream, dataString) => {
    stream.emit("data", Buffer.from(dataString));
};

export const emitStdoutData = (dataString) => {
    emitData(mockChildProcess.stdout, dataString);
};

export const emitStderrData = (dataString) => {
    emitData(mockChildProcess.stderr, dataString);
};

export const emitClose = (code) => {
    mockChildProcess.emit("close", code);
};

export const expectCommandToBe = async (expectedCommand) => {
    expect(spawn).toHaveBeenCalledWith(expectedCommand, { shell: true, stdio: "pipe" });
};

const expectStreamToBe = (stream, expectedOutput) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    const actualOutput = Buffer.concat(chunks).toString();
    expect(actualOutput).toBe(expectedOutput);
};

export const expectStdoutToBe = (expectedOutput) => {
    expectStreamToBe(mockChildProcess.stdout, expectedOutput);
};

export const expectStderrToBe = (expectedOutput) => {
    expectStreamToBe(mockChildProcess.stderr, expectedOutput);
};

export const expectThrowError = async (promise, expectedMessage) => {
    await expect(promise).rejects.toThrow(expectedMessage);
};
