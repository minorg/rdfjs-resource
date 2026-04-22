import type {
  BlankNode,
  Literal,
  NamedNode,
  Quad,
  Variable,
} from "@rdfjs/types";
import { Identifier } from "./Identifier.js";
import { MistypedValueError } from "./MistypedValueError.js";
import { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";

export class MistypedTermValueError extends MistypedValueError<
  BlankNode | Literal | NamedNode | Quad | Variable
> {
  constructor({
    actualValue,
    expectedValueType,
    focusResource,
    propertyPath,
  }: {
    actualValue: BlankNode | Literal | NamedNode | Quad | Variable;
    expectedValueType: string;
    focusResource: Resource;
    propertyPath: PropertyPath;
  }) {
    super({
      actualValue,
      expectedValueType,
      focusResource,
      message: `expected ${Identifier.toString(focusResource.identifier)} ${PropertyPath.toString(propertyPath)} to be a ${expectedValueType}, was ${actualValue.termType}`,
      propertyPath,
    });
  }
}
