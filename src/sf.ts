import { exec, execSfGetJson, type SpawnResult } from "./executors";

export * from "./executors";

interface SfCommandBuilderBase {
    (...args: unknown[]): SfCommandBuilder;
    $commands: string[];
    $flag(flag: string, ...argumentsList: unknown[]): SfCommandBuilder;
    toString(): string;
    exec(asJson?: boolean): Promise<SpawnResult | unknown>;
}

export type SfCommandBuilder = SfCommandBuilderBase & {
    [key: string]: SfCommandBuilder;
};

const copy = (obj: SfCommandBuilder): SfCommandBuilder => {
    const objCopy = (() => {}) as SfCommandBuilder;
    objCopy.$commands = [...obj.$commands];
    objCopy.$flag = obj.$flag;
    objCopy.toString = obj.toString;
    objCopy.exec = obj.exec;
    return objCopy;
};

const processArguments = (target: SfCommandBuilder, argumentsList: unknown[]): SfCommandBuilder => {
    if (argumentsList.length) {
        const validArguments = argumentsList.filter((arg) => arg !== undefined && arg !== null);
        if (validArguments.length) {
            target.$commands.push(validArguments.map(String).join(","));
        } else if (target.$commands.length > 1) {
            target.$commands.pop();
        }
    }
    return target;
};

const handler: ProxyHandler<SfCommandBuilder> = {
    apply: (target, _, argumentsList) => {
        const targetCopy = copy(target);
        return new Proxy(processArguments(targetCopy, argumentsList), handler);
    },
    get: (target, prop: string) => {
        if (Reflect.has(target, prop) || prop === "$flag") {
            return Reflect.get(target, prop);
        }
        const targetCopy = copy(target);
        const formattedArg = prop.replace(/([A-Z])|_/g, "-$1").toLowerCase();
        targetCopy.$commands.push(formattedArg);
        return new Proxy(targetCopy, handler);
    },
};

const base = (() => {}) as SfCommandBuilder;
base.$commands = ["sf"];
base.$flag = function (this: SfCommandBuilder, flag: string, ...argumentsList: unknown[]) {
    return (this as any)[flag](...argumentsList);
};
base.toString = function (this: SfCommandBuilder) {
    return this.$commands.join(" ");
};
base.exec = function (this: SfCommandBuilder, asJson = false) {
    const command = this.toString();
    return asJson ? execSfGetJson(command) : exec(command);
};

export const sf: SfCommandBuilder = new Proxy(base, handler);

export default sf;
