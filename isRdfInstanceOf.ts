import TermSet from "@rdfjs/term-set";
import type { BlankNode, DatasetCore, NamedNode } from "@rdfjs/types";
import { rdf, rdfs } from "@tpluscode/rdf-ns-builders";
import type { GetRdfInstanceQuadsParameters } from "./getRdfInstanceQuads.js";

export function isRdfInstanceOf({
  class_,
  instance,
  dataset,
  excludeSubclasses,
  instanceOfPredicate,
  subClassOfPredicate,
}: GetRdfInstanceQuadsParameters & {
  instance: BlankNode | NamedNode;
}): boolean {
  return isRdfInstanceOfRecursive({
    class_,
    dataset,
    excludeSubclasses: excludeSubclasses ?? false,
    instance,
    instanceOfPredicate: instanceOfPredicate ?? rdf.type,
    subClassOfPredicate: subClassOfPredicate ?? rdfs.subClassOf,
    visitedClasses: new TermSet<NamedNode>(),
  });
}

function isRdfInstanceOfRecursive({
  class_,
  dataset,
  excludeSubclasses,
  instance,
  instanceOfPredicate,
  subClassOfPredicate,
  visitedClasses,
}: {
  class_: NamedNode;
  dataset: DatasetCore;
  excludeSubclasses: boolean;
  instance: BlankNode | NamedNode;
  instanceOfPredicate: NamedNode;
  subClassOfPredicate: NamedNode;
  visitedClasses: TermSet<NamedNode>;
}): boolean {
  for (const _ of dataset.match(instance, instanceOfPredicate, class_)) {
    return true;
  }

  visitedClasses.add(class_);

  if (excludeSubclasses) {
    return false;
  }

  // Recurse into class's sub-classes that haven't been visited yet.
  for (const quad of dataset.match(null, subClassOfPredicate, class_, null)) {
    if (quad.subject.termType !== "NamedNode") {
      continue;
    }
    if (visitedClasses.has(quad.subject)) {
      continue;
    }
    if (
      isRdfInstanceOfRecursive({
        class_: quad.subject,
        dataset,
        excludeSubclasses,
        instance,
        instanceOfPredicate,
        subClassOfPredicate,
        visitedClasses,
      })
    ) {
      return true;
    }
  }

  return false;
}
