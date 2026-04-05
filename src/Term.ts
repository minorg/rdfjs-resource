import type { BlankNode, Literal, NamedNode } from "@rdfjs/types";
import { Identifier } from "./Identifier.js";
import { xsd } from "./vocabularies.js";

export type Term = BlankNode | Literal | NamedNode;

export namespace Term {
  // biome-ignore lint/suspicious/noShadowRestrictedNames: fine here
  export function toString(term: Term): string {
    switch (term.termType) {
      case "BlankNode":
      case "NamedNode":
        return Identifier.toString(term);
      case "Literal": {
        const literal = term;

        const escaped = literal.value
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r");

        const quoted = `"${escaped}"`;

        if (literal.language) {
          return `${quoted}@${literal.language}`;
        }
        if (!literal.datatype.equals(xsd.string)) {
          return `${quoted}^^<${literal.datatype.value}>`;
        }
        return quoted;
      }
    }
  }
}
