import { describe, it } from "vitest";
import { LiteralDecoder } from "../src/LiteralDecoder.js";
import { LiteralFactory } from "../src/LiteralFactory.js";
import { testData } from "./testData.js";

describe("LiteralDecoder", () => {
  const { objects } = testData;
  const literalFactory = new LiteralFactory();
  const sut = LiteralDecoder;

  for (const object of Object.values(objects)) {
    if (object.termType !== "Literal") {
      continue;
    }

    it(object.datatype.value, ({ expect }) => {
      const expectedLiteral = object;
      const actualPrimitive = sut
        .decodePrimitive(expectedLiteral)
        .unsafeCoerce();
      {
        const actualLiteral = literalFactory.primitive(
          actualPrimitive,
          expectedLiteral.datatype, // Specify datatype
        );
        expect(actualLiteral.equals(expectedLiteral)).toStrictEqual(true);
      }

      literalFactory.primitive(actualPrimitive); // Don't specify datatype
    });
  }
});
