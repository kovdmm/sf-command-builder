interface SfCommandResult {
    exitCode: number;
    stdout?: string;
    stderr?: string;
}

interface SfCommandBuilder {
    /** Stored command parts */
    readonly $commands: string[];

    /**
     * Adds a flag with its arguments to the command.
     * @param flag - the flag to be added (e.g. "--wait")
     * @param argumentsList - the arguments for the flag (e.g. 120 for "--wait 120")
     */
    $flag(flag: string, ...argumentsList: unknown[]): SfCommandBuilder;

    /** Converts the built command into a string. */
    toString(): string;

    /**
     * Executes the built command.
     * @param asJson - whether to parse output as JSON (appends `--json`)
     */
    exec(asJson?: boolean): Promise<SfCommandResult>;

    /** Any property access returns a new builder with the property appended as a subcommand. */
    [key: string]: SfCommandBuilder & ((...args: unknown[]) => SfCommandBuilder);
}

export declare const sf: SfCommandBuilder;
