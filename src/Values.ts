import type { NamedNode } from "@rdfjs/types";

import { Either, Left } from "purify-ts";

import { MissingValueError } from "./MissingValueError.js";
import type { Resource } from "./Resource.js";
import type { ValueError } from "./ValueError.js";

/**
 * Iterable sequence of values of a given type.
 *
 * Resource.values and .valuesOf return instances of this class instead of a simple array of values in order to
 * (1) preserve the focus resource that .values/.valuesOf was invoked on, in case of errors
 * (2) preserve the predicate that .values/.valuesOf was invoked with, in case of errors
 * (3) return purify types from methods like .find instead of null or undefined
 * (4) add some methods that aren't on arrays, like .chainMap and .head
 *
 * The class doesn't try to implement the entire Array interface. Methods are added as needed by downstream code.
 */
export abstract class Values<ValueT> implements Iterable<ValueT> {
  protected readonly focusResource: Resource;
  protected readonly predicate: NamedNode;

  abstract readonly length: number;

  protected constructor({
    focusResource,
    predicate,
  }: {
    focusResource: Resource;
    predicate: NamedNode;
  }) {
    this.focusResource = focusResource;
    this.predicate = predicate;
  }

  /**
   * Create a Values instance from an array of values.
   */
  static fromArray<ValueT>(parameters: {
    focusResource: Resource;
    predicate: NamedNode;
    values: readonly ValueT[];
  }): Values<ValueT> {
    return new ArrayValues(parameters);
  }

  /**
   * Create a Values instance from a single value.
   */
  static fromValue<ValueT>(parameters: {
    focusResource: Resource;
    predicate: NamedNode;
    value: ValueT;
  }) {
    return new SingletonValues(parameters);
  }

  abstract [Symbol.iterator](): Iterator<ValueT>;

  /**
   * For each value in the sequence, try to convert it to a new type / transform it using the provided callback.
   *
   * If any conversion fails, return the failure (the Left).
   *
   * If all of the conversions succeed, return a new Values with the converted values.
   *
   * This is a combination of Either.chain and Either.map.
   */
  chainMap<NewValueT>(
    callback: (value: ValueT, index: number) => Either<Error, NewValueT>,
  ): Either<Error, Values<NewValueT>> {
    const newValues: NewValueT[] = [];
    let valueI = 0;
    for (const value of this) {
      const callbackResult = callback(value, valueI);
      if (callbackResult.isLeft()) {
        return callbackResult;
      }
      newValues.push(callbackResult.extract() as NewValueT);
      valueI++;
    }
    return Either.of(
      Values.fromArray({
        focusResource: this.focusResource,
        values: newValues,
        predicate: this.predicate,
      }),
    );
  }

  /**
   * Concatenate another values of the same type to this Values, returning a new Values instance.
   */
  concat(...values: readonly ValueT[]): Values<ValueT> {
    return Values.fromArray({
      focusResource: this.focusResource,
      predicate: this.predicate,
      values: this.toArray().concat(...values),
    });
  }

  /**
   * Filter the values, returning a new Values instance.
   */
  filter(predicate: (value: ValueT, index: number) => boolean): Values<ValueT> {
    const filteredValues: ValueT[] = [];
    let valueI = 0;
    for (const value of this) {
      if (predicate(value, valueI)) {
        filteredValues.push(value);
      }
      valueI++;
    }
    return Values.fromArray({
      focusResource: this.focusResource,
      predicate: this.predicate,
      values: filteredValues,
    });
  }

  /**
   * Find a value that satisfies the given predicate.
   *
   * Return Right if a value satisfies the predicate, otherwise Left.
   */
  find(
    predicate: (value: ValueT, index: number) => boolean,
  ): Either<MissingValueError, ValueT> {
    let valueI = 0;
    for (const value of this) {
      if (predicate(value, valueI)) {
        return Either.of(value);
      }
      valueI++;
    }
    return Left(
      new MissingValueError({
        focusResource: this.focusResource,
        predicate: this.predicate,
      }),
    );
  }

  /**
   * Flatten a Values of iterables into a new Values.
   *
   * Equivalent of Array.flat.
   */
  flat<NewValueT>(): Values<NewValueT> {
    return Values.fromArray<NewValueT>({
      focusResource: this.focusResource,
      predicate: this.predicate,
      values: this.toArray().flat() as readonly NewValueT[],
    });
  }

  /**
   * Map each value to an array of values of a new type. Flatten those arrays and return the result as a new Values.
   */
  flatMap<NewValueT>(
    callback: (value: ValueT, index: number) => ReadonlyArray<NewValueT>,
  ): Values<NewValueT> {
    const newValues: NewValueT[] = [];
    let valueI = 0;
    for (const value of this) {
      newValues.push(...callback(value, valueI));
      valueI++;
    }
    return Values.fromArray({
      focusResource: this.focusResource,
      predicate: this.predicate,
      values: newValues,
    });
  }

  /**
   * Get the head of this sequence of values if the sequence is non-empty. Otherwise return Left.
   */
  head(): Either<ValueError, ValueT> {
    for (const value of this) {
      return Either.of(value);
    }
    return Left(
      new MissingValueError({
        focusResource: this.focusResource,
        predicate: this.predicate,
      }),
    );
  }

  /**
   * Map each value to a value of a new type and return a new Values with the mapped results.
   */
  map<NewValueT>(
    callback: (value: ValueT, index: number) => NewValueT,
  ): Values<NewValueT> {
    const newValues: NewValueT[] = [];
    let valueI = 0;
    for (const value of this) {
      newValues.push(callback(value, valueI));
      valueI++;
    }
    return Values.fromArray({
      focusResource: this.focusResource,
      predicate: this.predicate,
      values: newValues,
    });
  }

  /**
   * Convert this values to an array of the values.
   */
  abstract toArray(): readonly ValueT[];
}

/**
 * Private implementation of Resource.Values that iterates over an array.
 *
 * Must be in the same file to avoid circular dependencies.
 */
class ArrayValues<ValueT> extends Values<ValueT> {
  private readonly values: readonly ValueT[];

  constructor({
    values,
    ...superParameters
  }: {
    focusResource: Resource;
    predicate: NamedNode;
    values: readonly ValueT[];
  }) {
    super(superParameters);
    this.values = values;
  }

  override get length(): number {
    return this.values.length;
  }

  override [Symbol.iterator](): Iterator<ValueT> {
    return this.values[Symbol.iterator]();
  }

  override toArray(): readonly ValueT[] {
    return this.values;
  }
}

/**
 * Private implementation of Values that iterates over a single value.
 *
 * Must be in the same file to avoid circular dependencies.
 */
class SingletonValues<ValueT> extends Values<ValueT> {
  private readonly value: ValueT;

  override readonly length = 1;

  constructor({
    value,
    ...superParameters
  }: { focusResource: Resource; value: ValueT; predicate: NamedNode }) {
    super(superParameters);
    this.value = value;
  }

  override *[Symbol.iterator](): Iterator<ValueT> {
    yield this.value;
  }

  override toArray(): readonly ValueT[] {
    return [this.value];
  }
}
