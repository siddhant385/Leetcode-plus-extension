import { z } from "zod";
import { configSchema } from "../schema/options.schema";

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

function isObject(item: any) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function deepMerge(target: any, source: any) {
  let output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, { [key]: source[key] });
        else output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

export class ZodStorageManager<T extends z.ZodTypeAny> {
  public key: string;
  public schema: T;
  public data: z.infer<T>;

  constructor(key: string, schema: T) {
    this.key = key;
    this.schema = schema;

    try {
      this.data = this.schema.parse({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          "Zod Default Schema Error Details:",
          JSON.stringify(error.issues, null, 2),
        );
      }
      throw error;
    }
  }

  public async load(): Promise<z.infer<T>> {
    const result = await chrome.storage.local.get(this.key);
    const rawData = result[this.key];

    try {
      this.data = this.schema.parse(rawData ?? {});
    } catch (error) {
      console.error(
        `Validation failed for key "${this.key}". Using safe defaults.`,
        error,
      );
      this.data = this.schema.parse({});
    }
    return this.data;
  }

  public async save(newData: DeepPartial<z.infer<T>>): Promise<z.infer<T>> {
    const mergedData = deepMerge(this.data, newData);
    const validatedData = this.schema.parse(mergedData);

    await chrome.storage.local.set({ [this.key]: validatedData });
    this.data = validatedData;

    return this.data;
  }
}

export const appConfigManager = new ZodStorageManager(
  "app_config",
  configSchema,
);
