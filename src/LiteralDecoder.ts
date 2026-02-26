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
  const BIGINT_NUMBER_MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
  const BIGINT_NUMBER_MIN_SAFE_INTEGER = BigInt(Number.MIN_SAFE_INTEGER);

  function convertBigIntToNumber(
    literal: Literal,
    value: bigint,
  ): Either<Error, number> {
    if (
      value >= BIGINT_NUMBER_MIN_SAFE_INTEGER &&
      value <= BIGINT_NUMBER_MAX_SAFE_INTEGER
    ) {
      return Either.of(Number(value));
    }

    return Left(
      new LiteralValueError(
        literal,
        `bigint ${value} is outside number's safe integer range [${Number.MIN_SAFE_INTEGER}, ${Number.MAX_SAFE_INTEGER}]`,
      ),
    );
  }

  function convertNumberToBigInt(
    literal: Literal,
    value: number,
  ): Either<Error, bigint> {
    if (Number.isInteger(value)) {
      return Either.of(BigInt(value));
    }
    return Left(
      new LiteralValueError(literal, `number ${value} is not an integer`),
    );
  }

  export function decodeBigIntLiteral(literal: Literal): Either<Error, bigint> {
    const literalDatatypeDefinition =
      literalDatatypeDefinitions[literal.datatype.value];
    if (!literalDatatypeDefinition) {
      return Left(new LiteralDatatypeError(literal));
    }

    switch (literalDatatypeDefinition.kind) {
      case "bigint":
        return decodeBigIntLiteralValue(literal);
      case "float":
        return decodeFloatLiteralValue(literal).chain((value) =>
          convertNumberToBigInt(literal, value),
        );
      case "int":
        return decodeIntLiteralValue(literal).chain((value) =>
          convertNumberToBigInt(literal, value),
        );
      default:
        return Left(new LiteralDatatypeError(literal));
    }
  }

  function decodeBigIntLiteralValue(literal: Literal): Either<Error, bigint> {
    return Either.encase(() => BigInt(literal.value));
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
    const literalDatatypeDefinition =
      literalDatatypeDefinitions[literal.datatype.value];
    if (!literalDatatypeDefinition) {
      return Left(new LiteralDatatypeError(literal));
    }

    switch (literalDatatypeDefinition.kind) {
      case "bigint":
        return decodeBigIntLiteral(literal).chain((value) =>
          convertBigIntToNumber(literal, value),
        );
      case "float":
      case "int":
        return decodeFloatLiteralValue(literal);
      default:
        return Left(new LiteralDatatypeError(literal));
    }
  }

  function decodeFloatLiteralValue(literal: Literal): Either<Error, number> {
    return Either.encase(() => {
      switch (literal.value.toUpperCase()) {
        case "NAN":
          return NaN;
        case "INF":
        case "+INF":
          return Infinity;
        case "-INF":
          return -Infinity;
      }

      const value = Number.parseFloat(literal.value);
      if (Number.isNaN(value)) {
        throw new LiteralValueError(literal, "not a number");
      }
      return value;
    });
  }

  export function decodeIntLiteral(literal: Literal): Either<Error, number> {
    const literalDatatypeDefinition =
      literalDatatypeDefinitions[literal.datatype.value];
    if (!literalDatatypeDefinition) {
      return Left(new LiteralDatatypeError(literal));
    }

    switch (literalDatatypeDefinition.kind) {
      case "bigint":
        return decodeBigIntLiteral(literal).chain((value) =>
          convertBigIntToNumber(literal, value),
        );
      case "float":
      case "int":
        return decodeIntLiteralValue(literal);
      default:
        return Left(new LiteralDatatypeError(literal));
    }
  }

  function decodeIntLiteralValue(literal: Literal): Either<Error, number> {
    return decodeFloatLiteralValue(literal).chain((value) => {
      if (Number.isInteger(value)) {
        return Either.of(value);
      }
      return Left(new LiteralValueError(literal, `${value} is not an integer`));
    });
  }

  export function decodeNumberLiteral(literal: Literal): Either<Error, number> {
    const literalDatatypeDefinition =
      literalDatatypeDefinitions[literal.datatype.value];
    if (!literalDatatypeDefinition) {
      return Left(new LiteralDatatypeError(literal));
    }
    switch (literalDatatypeDefinition.kind) {
      case "bigint":
        return decodeBigIntLiteralValue(literal).chain((value) =>
          convertBigIntToNumber(literal, value),
        );
      case "float":
        return decodeFloatLiteralValue(literal);
      case "int":
        return decodeIntLiteralValue(literal);
      default:
        return Left(new LiteralDatatypeError(literal));
    }
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
