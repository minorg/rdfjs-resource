import { describe, it } from "vitest";
import { LiteralDecoder } from "../src/LiteralDecoder.js";
import { LiteralFactory } from "../src/LiteralFactory.js";
import { testData } from "./testData.js";

describe("LiteralFactory", () => {
  const { objects } = testData;
  const sut = new LiteralFactory();

  for (const object of Object.values(objects)) {
    if (object.termType !== "Literal") {
      continue;
    }

    it(object.datatype.value, ({ expect }) => {
      const expectedLiteral = object;
      const actualPrimitive =
        LiteralDecoder.decodePrimitive(expectedLiteral).unsafeCoerce();

      {
        const actualLiteral = sut.primitive(
          actualPrimitive,
          expectedLiteral.datatype, // Specify datatype
        );
        expect(actualLiteral.equals(expectedLiteral)).toStrictEqual(true);
      }

      sut.primitive(actualPrimitive); // Don't specify datatype
    });
  }
});
