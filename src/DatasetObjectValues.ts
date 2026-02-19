import TermSet from "@rdfjs/term-set";
import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { DatasetValues } from "./DatasetValues.js";
import type { TermValue } from "./TermValue.js";

/**
 * Private implementation of Values that iterates over a DatasetCore.
 *
 * Instances of this class are returned from value/values, so focusResource is the subject of the predicate and we're looking for objects.
 */
class DatasetObjectValues extends DatasetValues<TermValue> {
  override get length(): number {
    let length = 0;
    for (const _ of this) {
      length++;
    }
    return length;
  }

  override *[Symbol.iterator](): Iterator<TermValue> {
    if (this.unique) {
      const uniqueTerms = new TermSet<BlankNode | Literal | NamedNode>();
      for (const nonUniqueTerm of this.nonUniqueTermIterator()) {
        if (uniqueTerms.has(nonUniqueTerm)) {
          continue;
        }
        yield new TermValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueTerm,
        });
        uniqueTerms.add(nonUniqueTerm);
      }
    } else {
      for (const nonUniqueTerm of this.nonUniqueTermIterator()) {
        yield new TermValue({
          focusResource: this.focusResource,
          predicate: this.predicate,
          term: nonUniqueTerm,
        });
      }
    }
  }

  private *nonUniqueTermIterator(): Generator<BlankNode | Literal | NamedNode> {
    // if (this.inverse) {
    //   for (const quad of this.focusdataset.match(
    //     null,
    //     this.predicate,
    //     this.focusidentifier,
    //   )) {
    //     switch (quad.subject.termType) {
    //       case "BlankNode":
    //       case "NamedNode":
    //         yield quad.subject;
    //     }
    //   }
    // } else {
    for (const quad of this.focusdataset.match(
      this.focusidentifier,
      this.predicate,
      null,
      null,
    )) {
      switch (quad.object.termType) {
        case "BlankNode":
        case "Literal":
        case "NamedNode":
          yield quad.object;
      }
    }
  }

  override toArray(): readonly TermValue[] {
    return [...this];
  }
}
