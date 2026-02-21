import { describe, it } from "vitest";
import { LiteralDecoder } from "../src/LiteralDecoder.js";
import { LiteralFactory } from "../src/LiteralFactory.js";
import { xsd } from "../src/vocabularies.js";
import { testData } from "./testData.js";

describe("LiteralDecoder", () => {
  const { literals } = testData;
  const literalFactory = new LiteralFactory();
  const sut = LiteralDecoder;

  for (const expectedLiteral of Object.values(literals)) {
    it(expectedLiteral.datatype.value, ({ expect }) => {
      const actualPrimitive = sut
        .decodePrimitive(expectedLiteral)
        .unsafeCoerce();
      {
        const actualLiteral = literalFactory.primitive(
          actualPrimitive,
          expectedLiteral.datatype, // Specify datatype
        );
        if (
          !expectedLiteral.datatype.equals(xsd.dateTime) &&
          !expectedLiteral.datatype.equals(xsd.dateTimeStamp)
        ) {
          expect(actualLiteral.equals(expectedLiteral)).toStrictEqual(true);
        }
      }

      literalFactory.primitive(actualPrimitive); // Don't specify datatype
    });
  }
});
