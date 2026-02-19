import TermSet from "@rdfjs/term-set";
import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { DatasetValues } from "./DatasetValues.js";
import { IdentifierValue } from "./IdentifierValue.js";

/**
 * Private implementation of Values that iterates over a DatasetCore.
 *
 * Instances of this class are returned from valueOf/valuesOf, so focusResource is the object of the predicate and we're looking for subjects.
 */
class DatasetSubjectValues extends DatasetValues<IdentifierValue> {
  override *[Symbol.iterator](): Iterator<IdentifierValue> {
    if (this.unique) {
      const uniqueIdentifiers = new TermSet<BlankNode | Literal | NamedNode>();
      for (const nonUniqueIdentifier of this.nonUniqueIdentifierIterator()) {
        if (uniqueIdentifiers.has(nonUniqueIdentifier)) {
          continue;
        }
        yield new IdentifierValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueIdentifier,
        });
        uniqueIdentifiers.add(nonUniqueIdentifier);
      }
    } else {
      for (const nonUniqueIdentifier of this.nonUniqueIdentifierIterator()) {
        yield new IdentifierValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueIdentifier,
        });
      }
    }
  }

  private *nonUniqueIdentifierIterator(): Generator<BlankNode | NamedNode> {
    for (const quad of this.focusdataset.match(
      null,
      this.predicate,
      this.focusidentifier,
    )) {
      switch (quad.subject.termType) {
        case "BlankNode":
        case "NamedNode":
          yield quad.subject;
      }
    }
  }
}
