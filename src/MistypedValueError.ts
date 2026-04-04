import { Identifier } from "./Identifier.js";
import type { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";
import { ValueError } from "./ValueError.js";

export abstract class MistypedValueError<T> extends ValueError {
  readonly actualValue: T;
  readonly expectedValueType: string;

  constructor({
    actualValue,
    expectedValueType,
    focusResource,
    message,
    propertyPath,
  }: {
    actualValue: T;
    expectedValueType: string;
    message: string;
    focusResource: Resource;
    propertyPath: PropertyPath;
  }) {
    super({
      focusResource,
      message,
      propertyPath,
    });
    this.actualValue = actualValue;
    this.expectedValueType = expectedValueType;
  }
}
