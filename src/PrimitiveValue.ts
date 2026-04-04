import type { Primitive } from "./Primitive.js";
import { Value } from "./Value.js";

export class PrimitiveValue<
  PrimitiveT extends Primitive = Primitive,
> extends Value<PrimitiveT> {}
