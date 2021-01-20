/* eslint-disable @typescript-eslint/no-explicit-any */
import 'reflect-metadata';
import { Schema } from './schema';
import { RuleMap } from './rule-map';
import { IMap } from './map';
import { ClassType } from './class-type';
import { CheckResult } from './check-result';
import { MakeResult } from './make-result';

const MustBeKey = 'MUST:BE:CHECK';

export function Must<T, TRuleMap extends RuleMap<T> = RuleMap<T>>(rm: TRuleMap) {
    return (target: unknown, key?: string): void => {
        // -------------- Class Decorator --------------
        if (!key) {
            const schema = GetSchema(target);
            schema.rm = rm;
            Reflect.defineMetadata(MustBeKey, schema, target.constructor);
            return;
        }
        // ---------------------------------------------
        // -------------- Property Decorator -----------
        const schema = GetSchema(target.constructor);
        if (schema.has(key)) {
            throw new Error(`Decorator '${MustBeKey}' can only be applied once to '${key}'`);
        }
        schema.set(key, rm);
        Reflect.defineMetadata(MustBeKey, schema, target.constructor);
        // ---------------------------------------------
    };
}

export function Be<T>(map?: IMap): RuleMap<T> {
    return new RuleMap<T>(map);
}

export function Check<T>(claim: T[]): CheckResult;
export function Check<T>(claim: T): CheckResult;
export function Check<T>(claim: T[] | T): CheckResult {
    const schema = GetSchema<T>(claim.constructor);
    const errors = schema.check(claim);
    const pass = Object.keys(errors).length === 0;
    return { pass, errors: pass ? undefined : errors };
}

export function MakeIt<T>(constructor: [ClassType<T>], pool: unknown): MakeResult<T[]>;
export function MakeIt<T>(constructor: ClassType<T>, pool: unknown): MakeResult<T>;
export function MakeIt<T>(constructor: ClassType<T> | [ClassType<T>], pool: unknown): MakeResult<T[] | T> {
    const schema = GetSchema<T>(constructor);
    const result = schema.make<T>(constructor, pool);
    const pass = Object.keys(result.errors).length === 0;
    return { made: result.made, pass, errors: pass ? undefined : result.errors };
}

export function GetSchema<T>(target: unknown): Schema<T> {
    return <Schema<T>>Reflect.getMetadata(MustBeKey, target) ?? new Schema();
}
