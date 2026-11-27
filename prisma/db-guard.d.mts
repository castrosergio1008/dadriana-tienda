// Types for the shared .mjs guard, consumed by the TypeScript test suite.
export declare class FixtureGuardError extends Error {}

export declare const LOCAL_HOSTNAMES: Set<string>;

export declare function assertLocalDatabaseUrl(rawUrl: string | undefined): URL;
