import type {
  BlankNode,
  Literal,
  NamedNode,
  Quad,
  Variable,
} from "@rdfjs/types";
import { Identifier } from "./Identifier.js";
import type { Resource } from "./Resource.js";
import { ValueError } from "./ValueError.js";

export class MistypedTermValueError extends ValueError {
  readonly actualValue: BlankNode | Literal | NamedNode | Quad | Variable;
  readonly expectedValueType: string;

  constructor({
    actualValue,
    expectedValueType,
    focusResource,
    predicate,
  }: {
    actualValue: BlankNode | Literal | NamedNode | Quad | Variable;
    expectedValueType: string;
    focusResource: Resource;
    predicate: NamedNode;
  }) {
    super({
      focusResource,
      message: `expected ${Identifier.toString(focusResource.identifier)} ${predicate.value} to be a ${expectedValueType}, was ${actualValue.termType}`,
      predicate,
    });
    this.actualValue = actualValue;
    this.expectedValueType = expectedValueType;
  }
}
