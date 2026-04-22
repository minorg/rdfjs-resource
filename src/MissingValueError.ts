import { Identifier } from "./Identifier.js";
import { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";
import { ValueError } from "./ValueError.js";

export class MissingValueError extends ValueError {
  constructor({
    focusResource,
    propertyPath,
  }: {
    focusResource: Resource;
    propertyPath: PropertyPath;
  }) {
    super({
      focusResource,
      message: `${Identifier.toString(focusResource.identifier)} missing ${PropertyPath.toString(propertyPath)}`,
      propertyPath,
    });
  }
}
