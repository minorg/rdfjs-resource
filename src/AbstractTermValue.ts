import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import { Resource } from "./Resource.js";

export abstract class AbstractTermValue<
  TermT extends BlankNode | Literal | NamedNode,
> {
  protected readonly focusResource: Resource;
  protected readonly predicate: NamedNode;
  protected readonly term: TermT;

  constructor({
    focusResource,
    predicate,
    term,
  }: {
    focusResource: Resource;
    predicate: NamedNode;
    term: TermT;
  }) {
    this.focusResource = focusResource;
    this.predicate = predicate;
    this.term = term;
  }

  /**
   * Is the term a blank node?
   */
  isBlankNode(): boolean {
    return this.term.termType === "BlankNode";
  }

  /**
   * Is the term an IRI / NamedNode?
   */
  isIri(): boolean {
    return this.term.termType === "NamedNode";
  }

  /**
   * Try to convert the term to a blank node.
   */
  toBlankNode(): Either<MistypedTermValueError, BlankNode> {
    return this.term.termType === "BlankNode"
      ? Either.of(this.term as BlankNode)
      : Left(this.newMistypedValueError("BlankNode"));
  }

  /**
   * Try to convert the term to an IRI / NamedNode.
   */
  toIri(): Either<MistypedTermValueError, NamedNode> {
    return this.term.termType === "NamedNode"
      ? Either.of(this.term as NamedNode)
      : Left(this.newMistypedValueError("NamedNode"));
  }

  /**
   * Try to convert the term to a named resource.
   */
  toNamedResource(): Either<MistypedTermValueError, Resource<NamedNode>> {
    return this.toIri().map(
      (identifier) =>
        new Resource<NamedNode>({
          dataset: this.focusResource.dataset,
          identifier,
        }),
    );
  }

  toTerm(): TermT {
    return this.term;
  }

  protected newMistypedValueError(
    expectedValueType: string,
  ): MistypedTermValueError {
    return new MistypedTermValueError({
      actualValue: this.term,
      expectedValueType,
      focusResource: this.focusResource,
      predicate: this.predicate,
    });
  }
}
