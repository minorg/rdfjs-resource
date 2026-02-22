import type { Literal } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { literalDatatypeDefinitions } from "./literalDatatypeDefinitions.js";
import type { Primitive } from "./Primitive.js";

/**
 * Decode other types from RDF/JS Literals.
 *
 * Partially adapted from rdf-literal.js (https://github.com/rubensworks/rdf-literal.js), MIT license.
 */
export namespace LiteralDecoder {
  export function decodeBigIntLiteral(literal: Literal): Either<Error, bigint> {
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "bigint") {
      return decodeBigIntLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  function decodeBigIntLiteralValue(literal: Literal): Either<Error, bigint> {
    return Either.encase(() => {
      const value = BigInt(literal.value);

      const literalDatatypeDefinition =
        literalDatatypeDefinitions[literal.datatype.value];
      if (literalDatatypeDefinition?.kind !== "bigint") {
        throw new LiteralDatatypeError(literal);
      }

      const [min, max] = literalDatatypeDefinition.range;
      if (
        (min !== undefined && value < min) ||
        (max !== undefined && value > max)
      ) {
        throw new LiteralValueError(
          literal,
          `value (${value}) outside range [${min}, ${max}] of ${literal.datatype.value}`,
        );
      }

      return value;
    });
  }

  export function decodeBooleanLiteral(
    literal: Literal,
  ): Either<Error, boolean> {
    if (
      literalDatatypeDefinitions[literal.datatype.value]?.kind === "boolean"
    ) {
      return decodeBooleanLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  function decodeBooleanLiteralValue(literal: Literal): Either<Error, boolean> {
    switch (literal.value) {
      case "false":
      case "0":
        return Either.of(false);
      case "true":
      case "1":
        return Either.of(true);
      default:
        return Left(new LiteralValueError(literal));
    }
  }

  export function decodeDateLiteral(literal: Literal): Either<Error, Date> {
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "date") {
      return decodeDateLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  function decodeDateLiteralValue(literal: Literal): Either<Error, Date> {
    if (!literal.value.match(/^[0-9]+-[0-9][0-9]-[0-9][0-9]Z?$/)) {
      return Left(new LiteralValueError(literal));
    }

    return Either.of(new Date(literal.value));
  }

  export function decodeDateTimeLiteral(literal: Literal): Either<Error, Date> {
    if (
      literalDatatypeDefinitions[literal.datatype.value]?.kind === "datetime"
    ) {
      return decodeDateTimeLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  function decodeDateTimeLiteralValue(literal: Literal): Either<Error, Date> {
    if (
      !literal.value.match(
        /^[0-9]+-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9](\.[0-9][0-9][0-9])?((Z?)|([+-][0-9][0-9]:[0-9][0-9]))$/,
      )
    ) {
      return Left(new LiteralValueError(literal));
    }

    return Either.of(new Date(literal.value));
  }

  export function decodeFloatLiteral(literal: Literal): Either<Error, number> {
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "float") {
      return decodeFloatLiteralValue(literal);
    }

    return Left(new LiteralDatatypeError(literal));
  }

  function decodeFloatLiteralValue(literal: Literal): Either<Error, number> {
    return Either.encase(() => Number.parseFloat(literal.value));
  }

  export function decodeIntLiteral(literal: Literal): Either<Error, number> {
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "int") {
      return decodeIntLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  function decodeIntLiteralValue(literal: Literal): Either<Error, number> {
    return Either.encase(() => {
      const value = Number.parseInt(literal.value, 10);

      const literalDatatypeDefinition =
        literalDatatypeDefinitions[literal.datatype.value];
      if (literalDatatypeDefinition?.kind !== "int") {
        throw new LiteralDatatypeError(literal);
      }

      const [min, max] = literalDatatypeDefinition.range;
      if (
        (min !== undefined && value < min) ||
        (max !== undefined && value > max)
      ) {
        throw new LiteralValueError(
          literal,
          `value (${value}) outside range [${min}, ${max}] of ${literal.datatype.value}`,
        );
      }

      return value;
    });
  }

  export function decodeNumberLiteral(literal: Literal): Either<Error, number> {
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "float") {
      return decodeFloatLiteralValue(literal);
    }
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "int") {
      return decodeIntLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  export function decodePrimitiveLiteral(
    literal: Literal,
  ): Either<Error, Primitive> {
    const literalDatatypeDefinition =
      literalDatatypeDefinitions[literal.datatype.value];
    if (!literalDatatypeDefinition) {
      return Left(new LiteralDatatypeError(literal));
    }

    switch (literalDatatypeDefinition.kind) {
      case "bigdecimal":
        return Left(
          new LiteralDatatypeError(
            literal,
            "unable to decode bigdecimal Literal",
          ),
        );
      case "bigint":
        return decodeBigIntLiteralValue(literal);
      case "boolean":
        return decodeBooleanLiteralValue(literal);
      case "date":
        return decodeDateLiteralValue(literal);
      case "datetime":
        return decodeDateTimeLiteralValue(literal);
      case "float":
        return decodeFloatLiteralValue(literal);
      case "int":
        return decodeIntLiteralValue(literal);
      case "string":
        return decodeStringLiteralValue(literal);
    }
  }

  export function decodeStringLiteral(literal: Literal): Either<Error, string> {
    if (literalDatatypeDefinitions[literal.datatype.value]?.kind === "string") {
      return decodeStringLiteralValue(literal);
    }
    return Left(new LiteralDatatypeError(literal));
  }

  function decodeStringLiteralValue(literal: Literal): Either<Error, string> {
    return Either.of(literal.value);
  }

  class LiteralDatatypeError extends Error {
    constructor(
      readonly literal: Literal,
      message?: string,
    ) {
      super(
        message ?? `unrecognized Literal datatype: ${literal.datatype.value}`,
      );
    }
  }

  class LiteralValueError extends Error {
    constructor(
      readonly literal: Literal,
      message?: string,
    ) {
      super(message);
    }
  }
}
