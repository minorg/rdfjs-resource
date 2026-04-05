import dataFactory from "@rdfjs/data-model";
import datasetFactory from "@rdfjs/dataset";
import type { NamedNode, Quad_Graph, Variable } from "@rdfjs/types";

import { Either, Left } from "purify-ts";
import { Resource } from "./Resource.js";
import { ResourceSet } from "./ResourceSet.js";
import type { Value } from "./Value.js";
import { sh } from "./vocabularies.js";

interface AlternativePath {
  readonly termType: "AlternativePath";
  readonly members: readonly PropertyPath[];
}

interface InversePath {
  readonly termType: "InversePath";
  readonly path: PropertyPath;
}

interface OneOrMorePath {
  readonly termType: "OneOrMorePath";
  readonly path: PropertyPath;
}

type PredicatePath = NamedNode;

interface SequencePath {
  readonly termType: "SequencePath";
  readonly members: readonly PropertyPath[];
}

interface ZeroOrMorePath {
  readonly termType: "ZeroOrMorePath";
  readonly path: PropertyPath;
}

interface ZeroOrOnePath {
  readonly termType: "ZeroOrOnePath";
  readonly path: PropertyPath;
}

/**
 * A SHACL property path.
 */
export type PropertyPath =
  | AlternativePath
  | InversePath
  | OneOrMorePath
  | PredicatePath
  | SequencePath
  | ZeroOrMorePath
  | ZeroOrOnePath;

export namespace PropertyPath {
  export function $fromRdf(
    resource: Resource,
    options?: {
      graph?: Exclude<Quad_Graph, Variable>;
    },
  ): Either<Error, PropertyPath> {
    // Predicate path
    // sh:path ex:parent
    if (resource.identifier.termType === "NamedNode") {
      return Either.of(resource.identifier);
    }

    // The other property path types are BlankNodes

    const getPropertyPathList = (
      list: Either<Error, Resource.Values<Value>>,
    ): Either<Error, readonly PropertyPath[]> => {
      return list.chain((values) => {
        const members: PropertyPath[] = [];
        for (const value of values) {
          const resource = value.toResource().toMaybe();
          if (resource.isNothing()) {
            return Left(new Error("non-identifier in property path list"));
          }
          const member = PropertyPath.$fromRdf(resource.unsafeCoerce());
          if (member.isLeft()) {
            return member;
          }
          members.push(member.unsafeCoerce());
        }
        return Either.of(members);
      });
    };

    // Sequence path
    // sh:path ( ex:parent ex:firstName )
    {
      const list = resource.toList();
      if (list.isRight()) {
        return getPropertyPathList(list).map((members) => ({
          termType: "SequencePath",
          members,
        }));
      }
    }

    for (const quad of resource.dataset.match(
      resource.identifier,
      null,
      null,
      options?.graph,
    )) {
      switch (quad.object.termType) {
        case "BlankNode":
        case "NamedNode":
          break;
        default:
          return Left(
            new Error(
              `non-BlankNode/NamedNode property path object on path ${Resource.Identifier.toString(resource.identifier)}: ${quad.object.termType} ${quad.object.value}`,
            ),
          );
      }
      const objectResource = new Resource(resource.dataset, quad.object);

      // Alternative path
      // sh:path: [ sh:alternativePath ( ex:father ex:mother  ) ]
      if (quad.predicate.equals(sh.alternativePath)) {
        return getPropertyPathList(objectResource.toList()).map((members) => ({
          termType: "AlternativePath",
          members,
        }));
      }

      // Inverse path
      // sh:path: [ sh:inversePath ex:parent ]
      if (quad.predicate.equals(sh.inversePath)) {
        return PropertyPath.$fromRdf(objectResource).map((path) => ({
          termType: "InversePath",
          path,
        }));
      }

      // One or more path
      if (quad.predicate.equals(sh.oneOrMorePath)) {
        return PropertyPath.$fromRdf(objectResource).map((path) => ({
          termType: "OneOrMorePath",
          path,
        }));
      }

      // Zero or more path
      if (quad.predicate.equals(sh.zeroOrMorePath)) {
        return PropertyPath.$fromRdf(objectResource).map((path) => ({
          termType: "ZeroOrMorePath",
          path,
        }));
      }

      if (quad.predicate.equals(sh.zeroOrOnePath)) {
        return PropertyPath.$fromRdf(objectResource).map((path) => ({
          termType: "ZeroOrOnePath",
          path,
        }));
      }
    }

    return Left(
      new Error(
        `unrecognized or ill-formed SHACL property path ${Resource.Identifier.toString(resource.identifier)}`,
      ),
    );
  }

  export type $Filter = object;

  export function $filter(_filter: $Filter, _value: PropertyPath): boolean {
    return true;
  }

  export const $schema: Readonly<object> = {};

  export function $toString(propertyPath: PropertyPath): string {
    switch (propertyPath.termType) {
      case "AlternativePath":
      case "SequencePath":
        return `${propertyPath.termType}([${propertyPath.members.map(PropertyPath.toString).join(", ")}])`;
      case "InversePath":
      case "OneOrMorePath":
      case "ZeroOrMorePath":
      case "ZeroOrOnePath":
        return `${propertyPath.termType}(${PropertyPath.$toString(propertyPath.path)})`;
      case "NamedNode":
        return `PredicatePath(${propertyPath.value})`;
    }
  }

  export function $toRdf(
    propertyPath: PropertyPath,
    options?: {
      graph?: Exclude<Quad_Graph, Variable>;
      resourceSet?: ResourceSet;
    },
  ): Resource {
    const graph = options?.graph;
    const resourceSet =
      options?.resourceSet ??
      new ResourceSet(datasetFactory.dataset(), { dataFactory: dataFactory });

    if (propertyPath.termType === "NamedNode") {
      return resourceSet.resource(propertyPath);
    }

    const resource = resourceSet.resource(dataFactory.blankNode());

    switch (propertyPath.termType) {
      case "AlternativePath":
      case "SequencePath": {
        const members = propertyPath.members.map(
          (member) =>
            PropertyPath.$toRdf(member, { graph, resourceSet }).identifier,
        );
        if (propertyPath.termType === "AlternativePath") {
          resource.addList(sh.alternativePath, members, { graph });
        } else {
          resource.addListItems(members, { graph });
        }
        return resource;
      }
    }

    let predicate: NamedNode;
    switch (propertyPath.termType) {
      case "InversePath":
        predicate = sh.inversePath;
        break;
      case "OneOrMorePath":
        predicate = sh.oneOrMorePath;
        break;
      case "ZeroOrMorePath":
        predicate = sh.zeroOrMorePath;
        break;
      case "ZeroOrOnePath":
        predicate = sh.zeroOrOnePath;
        break;
    }

    resource.add(
      predicate,
      PropertyPath.$toRdf(propertyPath.path, { graph, resourceSet }).identifier,
      graph,
    );

    return resource;
  }
}
