import DefaultDataFactory from "@rdfjs/data-model";
import type { DataFactory, Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { xsd } from "./vocabularies.js";

/**
 * Coder-decoder methods for literals.
 *
 * Partially adapted from rdf-literal.js (https://github.com/rubensworks/rdf-literal.js), MIT license.
 */
export class LiteralCodec {
  private readonly dataFactory: DataFactory;

  constructor(options?: { dataFactory?: DataFactory }) {
    this.dataFactory = options?.dataFactory ?? DefaultDataFactory;
  }

  fromBoolean(value: boolean): Literal {
    return this.dataFactory.literal(value.toString(), xsd.boolean);
  }

  fromDate(value: Date, datatype?: NamedNode): Literal {
    if (datatype) {
      switch (datatype.value) {
        case "http://www.w3.org/2001/XMLSchema#date":
          return this.dataFactory.literal(
            value.toISOString().replace(/T.*$/, ""),
            datatype,
          );
        case "http://www.w3.org/2001/XMLSchema#dateTime":
          return this.dataFactory.literal(value.toISOString(), datatype);
        case "http://www.w3.org/2001/XMLSchema#gDay":
          return this.dataFactory.literal(
            value.getUTCDate().toString(),
            datatype,
          );
        case "http://www.w3.org/2001/XMLSchema#gMonthDay":
          return this.dataFactory.literal(
            `${value.getUTCMonth() + 1}-${value.getUTCDate()}`,
            datatype,
          );
        case "http://www.w3.org/2001/XMLSchema#gYear":
          return this.dataFactory.literal(
            value.getUTCFullYear().toString(),
            datatype,
          );
        case "http://www.w3.org/2001/XMLSchema#gYearMonth":
          return this.dataFactory.literal(
            `${value.getUTCFullYear()}-${value.getUTCMonth() + 1}`,
            datatype,
          );
      }
    }

    return this.dataFactory.literal(value.toISOString(), xsd.dateTime);
  }

  fromNumber(value: number, datatype?: NamedNode): Literal {
    if (datatype) {
      return this.dataFactory.literal(value.toString(10), datatype);
    }

    if (Number.isNaN(value)) {
      return this.dataFactory.literal("NaN", xsd.double);
    }

    if (value === Infinity) {
      return this.dataFactory.literal("INF", xsd.double);
    }

    if (value === -Infinity) {
      return this.dataFactory.literal("-INF", xsd.double);
    }

    const valueString = value.toString(10);

    if (Number.isInteger(value)) {
      return this.dataFactory.literal(valueString, xsd.integer);
    }

    // Convert the number to a literal following SPARQL rules = tests on the valueString form
    if (
      /^[+-]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)[eE][+-]?[0-9]+$/.test(valueString)
    ) {
      // Has exponent: xsd:double
      return this.dataFactory.literal(valueString, xsd.double);
    }

    // Default: xsd:decimal
    return this.dataFactory.literal(valueString, xsd.decimal);
  }

  fromPrimitive(
    value: boolean | Date | number | string,
    datatype?: NamedNode,
  ): Literal {
    switch (typeof value) {
      case "boolean":
        return this.fromBoolean(value);
      case "object": {
        if (value instanceof Date) {
          return this.fromDate(value, datatype);
        }
        throw new Error("not implemented");
      }
      case "number":
        return this.fromNumber(value, datatype);
      case "string":
        return this.fromString(value, datatype);
    }
  }

  fromString(value: string, datatype?: NamedNode) {
    return this.dataFactory.literal(value, datatype);
  }

  toBoolean(literal: Literal): Either<Error, boolean> {
    if (!literal.datatype.equals(xsd.boolean)) {
      return Left(
        new Error(
          `unexpected boolean Literal datatype: ${literal.datatype.value}`,
        ),
      );
    }
    switch (literal.value) {
      case "false":
      case "0":
        return Either.of(false);
      case "true":
      case "1":
        return Either.of(true);
      default:
        return Left(
          new Error(`unexpected boolean Literal value: ${literal.value}`),
        );
    }
  }

  toDate(literal: Literal): Either<Error, Date> {
    switch (literal.datatype.value) {
      case "http://www.w3.org/2001/XMLSchema#date": {
        if (!literal.value.match(/^[0-9]+-[0-9][0-9]-[0-9][0-9]Z?$/)) {
          return Left(
            new Error(
              `unexpected ${literal.datatype.value} value: ${literal.value}`,
            ),
          );
        }

        return Either.of(new Date(literal.value));
      }

      case "http://www.w3.org/2001/XMLSchema#dateTime": {
        if (
          !literal.value.match(
            /^[0-9]+-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9](\.[0-9][0-9][0-9])?((Z?)|([+-][0-9][0-9]:[0-9][0-9]))$/,
          )
        ) {
          return Left(
            new Error(
              `unexpected ${literal.datatype.value} value: ${literal.value}`,
            ),
          );
        }

        return Either.of(new Date(literal.value));
      }

      case "http://www.w3.org/2001/XMLSchema#gDay": {
        if (!literal.value.match(/^[0-9]+$/)) {
          return Left(
            new Error(
              `unexpected ${literal.datatype.value} value: ${literal.value}`,
            ),
          );
        }

        return Either.of(new Date(0, 0, Number.parseInt(literal.value, 10)));
      }

      case "http://www.w3.org/2001/XMLSchema#gMonthDay": {
        if (!literal.value.match(/^[0-9]+-[0-9][0-9]$/)) {
          return Left(
            new Error(
              `unexpected ${literal.datatype.value} value: ${literal.value}`,
            ),
          );
        }

        const valueSplit = literal.value.split("-");
        return Either.of(
          new Date(
            0,
            parseInt(valueSplit[0], 10) - 1,
            parseInt(valueSplit[1], 10),
          ),
        );
      }

      case "http://www.w3.org/2001/XMLSchema#gYear": {
        if (!literal.value.match(/^[0-9]+$/)) {
          return Left(
            new Error(
              `unexpected ${literal.datatype.value} value: ${literal.value}`,
            ),
          );
        }

        return Either.of(new Date(`${literal.value}-01-01`));
      }

      case "http://www.w3.org/2001/XMLSchema#gYearMonth": {
        if (!literal.value.match(/^[0-9]+-[0-9][0-9]$/)) {
          return Left(
            new Error(
              `unexpected ${literal.datatype.value} value: ${literal.value}`,
            ),
          );
        }

        return Either.of(new Date(`${literal.value}-01`));
      }

      default:
        return Left(
          new Error(`unexpected Date datatype: ${literal.datatype.value}`),
        );
    }
  }

  toNumber(literal: Literal): Either<Error, number> {
    // return Either.encase(() => {
    //   if (
    //     literal.datatype.equals(xsd.decimal) ||
    //     literal.datatype.equals(xsd.double) ||
    //     literal.datatype.equals(xsd.float)
    //   ) {
    //     return Number.parseFloat(literal.value);
    //   }
    //   throw new Error(
    //     `unrecognized number datatype: ${literal.datatype.value}`,
    //   );
    // });
  }
}
