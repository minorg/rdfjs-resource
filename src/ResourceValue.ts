import type { Resource } from "./Resource.js";
import { Value } from "./Value.js";

export class ResourceValue<
  ResourceT extends Resource,
> extends Value<ResourceT> {}
