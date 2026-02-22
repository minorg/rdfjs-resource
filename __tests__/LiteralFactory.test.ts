import { describe, it } from "vitest";
import { LiteralDecoder } from "../src/LiteralDecoder.js";
import { LiteralFactory } from "../src/LiteralFactory.js";
import { xsd } from "../src/vocabularies.js";
import { testData } from "./testData.js";

describe("LiteralFactory", () => {
  const { literals } = testData;
  const sut = new LiteralFactory();

  for (const expectedLiteral of Object.values(literals)) {
    it(expectedLiteral.datatype.value, ({ expect }) => {
      const actualPrimitive =
        LiteralDecoder.decodePrimitiveLiteral(expectedLiteral).unsafeCoerce();

      {
        const actualLiteral = sut.primitive(
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

      sut.primitive(actualPrimitive); // Don't specify datatype
    });
  }
});
