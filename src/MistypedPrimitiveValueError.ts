import { Identifier } from "./Identifier.js";
import { MistypedValueError } from "./MistypedValueError.js";
import type { Primitive } from "./Primitive.js";
import { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";

export class MistypedPrimitiveValueError extends MistypedValueError<Primitive> {
  constructor({
    actualValue,
    expectedValueType,
    focusResource,
    propertyPath,
  }: {
    actualValue: Primitive;
    expectedValueType: string;
    focusResource: Resource;
    propertyPath: PropertyPath;
  }) {
    super({
      actualValue,
      expectedValueType,
      focusResource,
      message: `expected ${Identifier.toString(focusResource.identifier)} ${PropertyPath.$toString(propertyPath)} to be a ${expectedValueType}, was ${typeof actualValue}`,
      propertyPath,
    });
  }
}
