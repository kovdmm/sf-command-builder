import { jest } from "@jest/globals";
import { stdout, stderr } from "node:process";
import { mockChildProcess, emitStdoutData, emitStderrData, emitClose, expectCommandToBe } from "./childProcess.mock";

const { spawn } = await import("node:child_process");
const { sf } = await import("../sf");

const generateRandomId = (prefix: string): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = prefix;
    while (id.length < 15) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

describe("sf.exec", () => {
    beforeEach(() => {
        console.log = jest.fn();
        console.error = jest.fn();
        jest.clearAllMocks();
    });

    describe("piped", () => {
        it("should execute command and pipe output", async () => {
            const mockOutput = "Command executed successfully";

            const resultPromise = sf.org.list.exec();
            emitStdoutData(mockOutput);
            emitClose(0);
            await resultPromise;

            expectCommandToBe("sf org list");
            expect(mockChildProcess.stdout.pipe).toHaveBeenCalledWith(stdout);
            expect(mockChildProcess.stderr.pipe).toHaveBeenCalledWith(stderr);
        });

        it("should throw error when command fails", async () => {
            const errorMessage = "Command failed";

            const resultPromise = sf.org.list.exec();
            emitStderrData(errorMessage);
            emitClose(1);

            await expect(resultPromise).rejects.toThrow("Command returned non-zero exit code: 1");
        });

        it("should handle empty output", async () => {
            const resultPromise = sf.org.list.exec();
            emitClose(0);
            await resultPromise;

            expectCommandToBe("sf org list");
        });
    });

    describe("as json", () => {
        it("should parse JSON output from SF command", async () => {
            const command = sf.org.list;
            const jsonOutput = { status: 0, result: { orgs: ["org1", "org2"] } };

            const resultPromise = command.exec(true);
            emitStdoutData(JSON.stringify(jsonOutput));
            emitClose(0);
            const result = await resultPromise;

            expect(spawn).toHaveBeenCalledWith("sf org list --json", { shell: true, stdio: "pipe" });
            expect(result).toEqual(jsonOutput);
        });

        it("should return default object when stdout is empty", async () => {
            const command = sf.org.list;

            const resultPromise = command.exec(true);
            emitClose(0);
            const result = await resultPromise;

            expect(result).toEqual({ exitCode: -1 });
        });

        it("should handle complex JSON objects", async () => {
            const command = sf.data.query.__query('"SELECT Id, (SELECT Id FROM Contacts) FROM Account"');
            const complexJsonOutput = {
                status: 0,
                result: {
                    records: [
                        {
                            Id: generateRandomId("001"),
                            Contacts: {
                                records: [{ Id: generateRandomId("003") }, { Id: generateRandomId("003") }],
                            },
                        },
                    ],
                },
            };

            const resultPromise = command.exec(true);
            emitStdoutData(JSON.stringify(complexJsonOutput));
            emitClose(0);
            const result = await resultPromise;

            expect(spawn).toHaveBeenCalledWith(
                'sf data query --query "SELECT Id, (SELECT Id FROM Contacts) FROM Account" --json',
                { shell: true, stdio: "pipe" },
            );
            expect(result).toEqual(complexJsonOutput);
        });
    });
});
