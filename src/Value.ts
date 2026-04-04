import type { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";

export class Value<T> {
  readonly focusResource: Resource;
  readonly propertyPath: PropertyPath;
  readonly value: T;

  constructor({
    focusResource,
    propertyPath,
    value,
  }: {
    focusResource: Resource;
    propertyPath: PropertyPath;
    value: T;
  }) {
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
    this.value = value;
  }
}
