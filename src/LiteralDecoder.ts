import type { Literal, NamedNode } from "@rdfjs/types";
import { Either, Left } from "purify-ts";
import { numericXsdDatatypeRanges } from "./numericXsdDatatypeRanges.js";
import type { Primitive } from "./Primitive.js";
import { xsd } from "./vocabularies.js";

/**
 * Decode other types from RDF/JS Literals.
 *
 * Partially adapted from rdf-literal.js (https://github.com/rubensworks/rdf-literal.js), MIT license.
 */
export namespace LiteralDecoder {
  function checkDatatype(
    literal: Literal,
    expectedDataType: NamedNode,
  ): Either<Error, Literal> {
    if (!literal.datatype.equals(expectedDataType)) {
      return Left(
        new UnexpectedLiteralDatatypeError(literal, expectedDataType),
      );
    }

    return Either.of(literal);
  }

  export function decodeBoolean(literal: Literal): Either<Error, boolean> {
    return checkDatatype(literal, xsd.boolean).chain(decodeBooleanValue);
  }

  function decodeBooleanValue(literal: Literal): Either<Error, boolean> {
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

  export function decodeDate(literal: Literal): Either<Error, Date> {
    return checkDatatype(literal, xsd.date).chain(decodeDateValue);
  }

  function decodeDateValue(literal: Literal): Either<Error, Date> {
    if (!literal.value.match(/^[0-9]+-[0-9][0-9]-[0-9][0-9]Z?$/)) {
      return Left(new LiteralValueError(literal));
    }

    return Either.of(new Date(literal.value));
  }

  export function decodeDateLike(literal: Literal): Either<Error, Date> {
    switch (literal.datatype.value) {
      case "http://www.w3.org/2001/XMLSchema#date":
        return decodeDateValue(literal);

      case "http://www.w3.org/2001/XMLSchema#dateTime":
        return decodeDateTimeValue(literal);

      case "http://www.w3.org/2001/XMLSchema#gDay":
        return decodeGDayValue(literal);

      case "http://www.w3.org/2001/XMLSchema#gMonthDay":
        return decodeGMonthDayValue(literal);

      case "http://www.w3.org/2001/XMLSchema#gYear":
        return decodeGYearValue(literal);

      case "http://www.w3.org/2001/XMLSchema#gYearMonth":
        return decodeGYearMonthValue(literal);

      default:
        return Left(new UnrecognizedLiteralDatatypeError(literal));
    }
  }

  export function decodeDateTime(literal: Literal): Either<Error, Date> {
    return checkDatatype(literal, xsd.dateTime).chain(decodeDateTimeValue);
  }

  function decodeDateTimeValue(literal: Literal): Either<Error, Date> {
    if (
      !literal.value.match(
        /^[0-9]+-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9](\.[0-9][0-9][0-9])?((Z?)|([+-][0-9][0-9]:[0-9][0-9]))$/,
      )
    ) {
      return Left(new LiteralValueError(literal));
    }

    return Either.of(new Date(literal.value));
  }

  export function decodeDecimal(literal: Literal): Either<Error, number> {
    return checkDatatype(literal, xsd.decimal).chain(decodeFloatLikeValue);
  }

  export function decodeDouble(literal: Literal): Either<Error, number> {
    return checkDatatype(literal, xsd.double).chain(decodeFloatLikeValue);
  }

  export function decodeFloat(literal: Literal): Either<Error, number> {
    return checkDatatype(literal, xsd.float).chain(decodeFloatLikeValue);
  }

  export function decodeFloatLike(literal: Literal): Either<Error, number> {
    if (isFloatLikeDatatype(literal.datatype)) {
      return decodeFloatLikeValue(literal);
    }

    return Left(new UnrecognizedLiteralDatatypeError(literal));
  }

  function decodeFloatLikeValue(literal: Literal): Either<Error, number> {
    return Either.encase(() => Number.parseFloat(literal.value));
  }

  function decodeGDayValue(literal: Literal): Either<Error, Date> {
    if (!literal.value.match(/^[0-9]+$/)) {
      return Left(new LiteralValueError(literal));
    }

    return Either.of(new Date(0, 0, Number.parseInt(literal.value, 10)));
  }

  function decodeGMonthDayValue(literal: Literal): Either<Error, Date> {
    if (!literal.value.match(/^[0-9]+-[0-9][0-9]$/)) {
      return Left(new LiteralValueError(literal));
    }

    const valueSplit = literal.value.split("-");
    return Either.of(
      new Date(0, parseInt(valueSplit[0], 10) - 1, parseInt(valueSplit[1], 10)),
    );
  }

  function decodeGYearValue(literal: Literal): Either<Error, Date> {
    if (!literal.value.match(/^[0-9]+$/)) {
      return Left(new LiteralValueError(literal));
    }

    return Either.of(new Date(`${literal.value}-01-01`));
  }

  function decodeGYearMonthValue(literal: Literal): Either<Error, Date> {
    if (!literal.value.match(/^[0-9]+-[0-9][0-9]$/)) {
      return Left(new LiteralValueError(literal));
    }
    return Either.of(new Date(`${literal.value}-01`));
  }

  export function decodeIntLike(literal: Literal): Either<Error, number> {
    if (isIntLikeDatatype(literal.datatype)) {
      return decodeIntLikeValue(literal);
    }
    return Left(new UnrecognizedLiteralDatatypeError(literal));
  }

  function decodeIntLikeValue(literal: Literal): Either<Error, number> {
    return Either.encase(() => {
      const value = Number.parseInt(literal.value, 10);

      const range = numericXsdDatatypeRanges[literal.datatype.value];
      if (!range) {
        throw new UnrecognizedLiteralDatatypeError(literal);
      }

      const [min, max] = range;
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

  export function decodeNumber(literal: Literal): Either<Error, number> {
    if (isFloatLikeDatatype(literal.datatype)) {
      return decodeFloatLikeValue(literal);
    }
    if (isIntLikeDatatype(literal.datatype)) {
      return decodeIntLikeValue(literal);
    }
    return Left(new UnrecognizedLiteralDatatypeError(literal));
  }

  export function decodePrimitive(literal: Literal): Either<Error, Primitive> {
    if (isBooleanDatatype(literal.datatype)) {
      return decodeBooleanValue(literal);
    }
    if (isDateLikeDatatype(literal.datatype)) {
      return decodeDateLike(literal);
    }
    if (isFloatLikeDatatype(literal.datatype)) {
      return decodeFloatLikeValue(literal);
    }
    if (isIntLikeDatatype(literal.datatype)) {
      return decodeIntLikeValue(literal);
    }
    return Left(new UnrecognizedLiteralDatatypeError(literal));
  }

  export function decodeStringLike(literal: Literal): Either<Error, string> {
    if (isStringLikeDatatype(literal.datatype)) {
      return decodeStringLikeValue(literal);
    }
    return Left(new UnrecognizedLiteralDatatypeError(literal));
  }

  function decodeStringLikeValue(literal: Literal): Either<Error, string> {
    return Either.of(literal.value);
  }

  function isBooleanDatatype(datatype: NamedNode): boolean {
    return datatype.value === xsd.boolean.value;
  }

  function isDateLikeDatatype(datatype: NamedNode): boolean {
    switch (datatype.value) {
      case "http://www.w3.org/2001/XMLSchema#date":
      case "http://www.w3.org/2001/XMLSchema#dateTime":
      case "http://www.w3.org/2001/XMLSchema#gDay":
      case "http://www.w3.org/2001/XMLSchema#gMonthDay":
      case "http://www.w3.org/2001/XMLSchema#gYear":
      case "http://www.w3.org/2001/XMLSchema#gYearMonth":
        return true;
      default:
        return false;
    }
  }

  function isFloatLikeDatatype(datatype: NamedNode): boolean {
    switch (datatype.value) {
      case "http://www.w3.org/2001/XMLSchema#decimal":
      case "http://www.w3.org/2001/XMLSchema#double":
      case "http://www.w3.org/2001/XMLSchema#float":
        return true;
      default:
        return false;
    }
  }

  function isIntLikeDatatype(datatype: NamedNode): boolean {
    switch (datatype.value) {
      case "http://www.w3.org/2001/XMLSchema#byte":
      case "http://www.w3.org/2001/XMLSchema#int":
      case "http://www.w3.org/2001/XMLSchema#integer":
      case "http://www.w3.org/2001/XMLSchema#long":
      case "http://www.w3.org/2001/XMLSchema#negativeInteger":
      case "http://www.w3.org/2001/XMLSchema#nonNegativeInteger":
      case "http://www.w3.org/2001/XMLSchema#nonPositiveInteger":
      case "http://www.w3.org/2001/XMLSchema#positiveInteger":
      case "http://www.w3.org/2001/XMLSchema#short":
      case "http://www.w3.org/2001/XMLSchema#unsignedByte":
      case "http://www.w3.org/2001/XMLSchema#unsignedInt":
      case "http://www.w3.org/2001/XMLSchema#unsignedLong":
      case "http://www.w3.org/2001/XMLSchema#unsignedShort":
        return true;
      default:
        return false;
    }
  }

  function isStringLikeDatatype(datatype: NamedNode): boolean {
    switch (datatype.value) {
      case "http://www.w3.org/1999/02/22-rdf-syntax-ns#dirLangString":
      case "http://www.w3.org/1999/02/22-rdf-syntax-ns#langString":
      case "http://www.w3.org/2001/XMLSchema#anyURI":
      case "http://www.w3.org/2001/XMLSchema#base64Binary":
      case "http://www.w3.org/2001/XMLSchema#duration":
      case "http://www.w3.org/2001/XMLSchema#hexBinary":
      case "http://www.w3.org/2001/XMLSchema#language":
      case "http://www.w3.org/2001/XMLSchema#Name":
      case "http://www.w3.org/2001/XMLSchema#NCName":
      case "http://www.w3.org/2001/XMLSchema#NMTOKEN":
      case "http://www.w3.org/2001/XMLSchema#normalizedString":
      case "http://www.w3.org/2001/XMLSchema#string":
      case "http://www.w3.org/2001/XMLSchema#time":
      case "http://www.w3.org/2001/XMLSchema#token":
        return true;
      default:
        return false;
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

  class UnexpectedLiteralDatatypeError extends Error {
    constructor(
      readonly literal: Literal,
      readonly expectedDatatype: NamedNode,
    ) {
      super(
        `expected ${expectedDatatype.value} Literal, actual ${literal.datatype.value}`,
      );
    }
  }

  class UnrecognizedLiteralDatatypeError extends Error {
    constructor(readonly literal: Literal) {
      super(`unrecognized Literal datatype: ${literal.datatype.value}`);
    }
  }
}
