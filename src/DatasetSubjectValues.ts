import TermSet from "@rdfjs/term-set";
import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { DatasetValues } from "./DatasetValues.js";
import { IdentifierValue } from "./IdentifierValue.js";

/**
 * Implementation of Values that iterates over a DatasetCore.
 *
 * Instances of this class are returned from valueOf/valuesOf, so focusResource is the object of the propertyPath and we're looking for subjects.
 */
export class DatasetSubjectValues extends DatasetValues<IdentifierValue> {
  override *[Symbol.iterator](): Iterator<IdentifierValue> {
    if (this.unique) {
      const uniqueIdentifiers = new TermSet<BlankNode | Literal | NamedNode>();
      for (const nonUniqueIdentifier of this.nonUniqueIdentifierIterator()) {
        if (uniqueIdentifiers.has(nonUniqueIdentifier)) {
          continue;
        }
        yield new IdentifierValue({
          dataFactory: this.dataFactory,
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
          term: nonUniqueIdentifier,
        });
        uniqueIdentifiers.add(nonUniqueIdentifier);
      }
    } else {
      for (const nonUniqueIdentifier of this.nonUniqueIdentifierIterator()) {
        yield new IdentifierValue({
          dataFactory: this.dataFactory,
          focusResource: this.focusResource,
          propertyPath: this.propertyPath,
          term: nonUniqueIdentifier,
        });
      }
    }
  }

  private *nonUniqueIdentifierIterator(): Generator<BlankNode | NamedNode> {
    for (const quad of this.focusResource.dataset.match(
      null,
      this.propertyPath,
      this.focusResource.identifier,
      this.graph,
    )) {
      switch (quad.subject.termType) {
        case "BlankNode":
        case "NamedNode":
          yield quad.subject;
      }
    }
  }
}
