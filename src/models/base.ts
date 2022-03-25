import type { Constructor } from "./utils";
import type { DetailedAsyncAPI } from "../types";

export interface ModelMetadata<P = unknown> {
  asyncapi: DetailedAsyncAPI;
  pointer: string;
  parent: P | null;
}

export abstract class BaseModel {
  constructor(
    protected readonly _json: Record<string, any>,
    protected readonly _meta: ModelMetadata = {} as any,
  ) {}

  json<T = Record<string, any>>(): T;
  json<T = any>(key: string | number): T;
  json(key?: string | number) {
    if (key === undefined) return this._json;
    if (!this._json) return;
    return this._json[String(key)];
  }

  meta(): ModelMetadata {
    return this._meta!;
  }

  jsonPath(field?: string): string | undefined {
    if (typeof field !== 'string') {
      return this._meta?.pointer;
    }
    return `${this._meta?.pointer}/${field}`;
  }

  protected createModel<T extends BaseModel>(Model: Constructor<T>, value: any, { id, parent, pointer }: { id?: string, parent?: any, pointer: string | number }): T {
    const meta = { asyncapi: this._meta.asyncapi, parent: parent || this, pointer } as ModelMetadata;
    if (id) {
      return new Model(id, value, meta);
    }
    return new Model(value, meta);
  }
}