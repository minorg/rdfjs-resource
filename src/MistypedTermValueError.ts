import type {
  BlankNode,
  Literal,
  NamedNode,
  Quad,
  Variable,
} from "@rdfjs/types";
import { Identifier } from "./Identifier.js";
import { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";
import { ValueError } from "./ValueError.js";

export class MistypedTermValueError extends ValueError {
  readonly actualValue: BlankNode | Literal | NamedNode | Quad | Variable;
  readonly expectedValueType: string;

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
      focusResource,
      message: `expected ${Identifier.toString(focusResource.identifier)} ${PropertyPath.$toString(propertyPath)} to be a ${expectedValueType}, was ${actualValue.termType}`,
      propertyPath,
    });
    this.actualValue = actualValue;
    this.expectedValueType = expectedValueType;
  }
}
