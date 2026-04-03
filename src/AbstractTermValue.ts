import type { BlankNode, DataFactory, Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { MistypedTermValueError } from "./MistypedTermValueError.js";
import type { PropertyPath } from "./PropertyPath.js";
import { Resource } from "./Resource.js";

export abstract class AbstractTermValue<
  TermT extends BlankNode | Literal | NamedNode,
> {
  protected readonly dataFactory: DataFactory;
  protected readonly focusResource: Resource;
  protected readonly propertyPath: PropertyPath;
  protected readonly term: TermT;

  constructor({
    dataFactory,
    focusResource,
    propertyPath,
    term,
  }: {
    dataFactory: DataFactory;
    focusResource: Resource;
    propertyPath: PropertyPath;
    term: TermT;
  }) {
    this.dataFactory = dataFactory;
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
    this.term = term;
  }

  get termType(): "BlankNode" | "Literal" | "NamedNode" {
    return this.term.termType;
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
        new Resource<NamedNode>(this.focusResource.dataset, identifier, {
          dataFactory: this.dataFactory,
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
      propertyPath: this.propertyPath,
    });
  }
}
