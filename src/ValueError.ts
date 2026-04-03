import type { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";

export abstract class ValueError extends Error {
  readonly focusResource: Resource;
  readonly propertyPath: PropertyPath;

  constructor({
    focusResource,
    message,
    propertyPath,
  }: { focusResource: Resource; message: string; propertyPath: PropertyPath }) {
    super(message);
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
  }
}
