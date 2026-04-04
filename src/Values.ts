import { Either, Left } from "purify-ts";

import { MissingValueError } from "./MissingValueError.js";
import type { PropertyPath } from "./PropertyPath.js";
import type { Resource } from "./Resource.js";
import type { Value } from "./Value.js";
import type { ValueError } from "./ValueError.js";

/**
 * Iterable sequence of values of a given type.
 *
 * Resource.values and .valuesOf return instances of this class instead of a simple array of values in order to
 * (1) preserve the focus resource that .values/.valuesOf was invoked on, in case of errors
 * (2) preserve the propertyPath that .values/.valuesOf was invoked with, in case of errors
 * (3) return purify types from methods like .find instead of null or undefined
 * (4) add some methods that aren't on arrays, like .chainMap and .head
 *
 * The class doesn't try to implement the entire Array interface. Methods are added as needed by downstream code.
 */
export abstract class Values<T> implements Iterable<Value<T>> {
  readonly focusResource: Resource;
  readonly propertyPath: PropertyPath;

  abstract readonly length: number;

  protected constructor({
    focusResource,
    propertyPath,
  }: {
    focusResource: Resource;
    propertyPath: PropertyPath;
  }) {
    this.focusResource = focusResource;
    this.propertyPath = propertyPath;
  }

  /**
   * Create a Values instance that is empty.
   */
  static empty<T>(parameters: {
    focusResource: Resource;
    propertyPath: PropertyPath;
  }): Values<T> {
    return new EmptyValues(parameters);
  }

  /**
   * Create a Values instance from an array of values.
   */
  static fromArray<T>(parameters: {
    focusResource: Resource;
    propertyPath: PropertyPath;
    values: readonly Value<T>[];
  }): Values<T> {
    if (Values.length === 0) {
      return Values.empty(parameters);
    }

    return new ArrayValues(parameters);
  }

  /**
   * Create a Values instance from a single value.
   */
  static fromValue<ValueT extends Value<unknown>>(parameters: {
    focusResource: Resource;
    propertyPath: PropertyPath;
    value: ValueT;
  }) {
    return new SingletonValues(parameters);
  }

  abstract [Symbol.iterator](): Iterator<Value<T>>;

  /**
   * For each value in the sequence, try to convert it to a new type / transform it using the provided callback.
   *
   * If any conversion fails, return the failure (the Left).
   *
   * If all of the conversions succeed, return a new Values with the converted values.
   *
   * This is a combination of Either.chain and Either.map.
   */
  chainMap<NewT>(
    callback: (value: Value<T>, index: number) => Either<Error, Value<NewT>>,
  ): Either<Error, Values<NewT>> {
    const newValues: Value<NewT>[] = [];
    let valueI = 0;
    for (const value of this) {
      const callbackResult = callback(value, valueI);
      if (callbackResult.isLeft()) {
        return callbackResult;
      }
      newValues.push(callbackResult.extract() as Value<NewT>);
      valueI++;
    }
    return Either.of(
      Values.fromArray({
        focusResource: this.focusResource,
        propertyPath: this.propertyPath,
        values: newValues,
      }),
    );
  }

  // /**
  //  * Concatenate another values of the same type to this Values, returning a new Values instance.
  //  */
  // concat(...values: readonly ValueT[]): Values<ValueT> {
  //   return Values.fromArray({
  //     focusResource: this.focusResource,
  //     propertyPath: this.propertyPath,
  //     values: this.toArray().concat(...values),
  //   });
  // }

  /**
   * Filter the values, returning a new Values instance.
   */
  filter(propertyPath: (value: Value<T>, index: number) => boolean): Values<T> {
    const filteredValues: Value<T>[] = [];
    let valueI = 0;
    for (const value of this) {
      if (propertyPath(value, valueI)) {
        filteredValues.push(value);
      }
      valueI++;
    }
    return Values.fromArray({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      values: filteredValues,
    });
  }

  /**
   * Find a value that satisfies the given propertyPath.
   *
   * Return Right if a value satisfies the propertyPath, otherwise Left.
   */
  find(
    propertyPath: (value: Value<T>, index: number) => boolean,
  ): Either<MissingValueError, Value<T>> {
    let valueI = 0;
    for (const value of this) {
      if (propertyPath(value, valueI)) {
        return Either.of(value);
      }
      valueI++;
    }
    return Left(
      new MissingValueError({
        focusResource: this.focusResource,
        propertyPath: this.propertyPath,
      }),
    );
  }

  /**
   * Flatten a Values of iterables into a new Values.
   *
   * Equivalent of Array.flat.
   */
  flat<NewT>(): Values<NewT> {
    return Values.fromArray<NewT>({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      values: this.toArray().flat() as unknown as readonly Value<NewT>[],
    });
  }

  /**
   * Map each value to an array of values of a new type. Flatten those arrays and return the result as a new Values.
   */
  flatMap<NewT>(
    callback: (value: Value<T>, index: number) => ReadonlyArray<Value<NewT>>,
  ): Values<NewT> {
    const newValues: Value<NewT>[] = [];
    let valueI = 0;
    for (const value of this) {
      newValues.push(...callback(value, valueI));
      valueI++;
    }
    return Values.fromArray({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      values: newValues,
    });
  }

  /**
   * Get the head of this sequence of values if the sequence is non-empty. Otherwise return Left.
   */
  head(): Either<ValueError, Value<T>> {
    for (const value of this) {
      return Either.of(value);
    }
    return Left(
      new MissingValueError({
        focusResource: this.focusResource,
        propertyPath: this.propertyPath,
      }),
    );
  }

  /**
   * Map each value to a value of a new type and return a new Values with the mapped results.
   */
  map<NewT>(
    callback: (value: Value<T>, index: number) => Value<NewT>,
  ): Values<NewT> {
    const newValues: Value<NewT>[] = [];
    let valueI = 0;
    for (const value of this) {
      newValues.push(callback(value, valueI));
      valueI++;
    }
    return Values.fromArray({
      focusResource: this.focusResource,
      propertyPath: this.propertyPath,
      values: newValues,
    });
  }

  /**
   * Convert this values to an array of the values.
   */
  abstract toArray(): readonly Value<T>[];
}

/**
 * Private implementation of Resource.Values that iterates over an array.
 *
 * Must be in the same file to avoid circular dependencies.
 */
class ArrayValues<T> extends Values<T> {
  private readonly values: readonly Value<T>[];

  constructor({
    values,
    ...superParameters
  }: {
    focusResource: Resource;
    propertyPath: PropertyPath;
    values: readonly Value<T>[];
  }) {
    super(superParameters);
    this.values = values;
  }

  override get length(): number {
    return this.values.length;
  }

  override [Symbol.iterator](): Iterator<Value<T>> {
    return this.values[Symbol.iterator]();
  }

  override toArray(): readonly Value<T>[] {
    return this.values;
  }
}

/**
 * Private implementation of Resource.Values that is empty.
 */
class EmptyValues<T> extends Values<T> {
  override get length(): number {
    return 0;
  }

  override [Symbol.iterator](): Iterator<Value<T>> {
    return this.toArray()[Symbol.iterator]();
  }

  override toArray(): readonly Value<T>[] {
    return [];
  }
}

/**
 * Private implementation of Values that iterates over a single value.
 *
 * Must be in the same file to avoid circular dependencies.
 */
class SingletonValues<T> extends Values<T> {
  private readonly value: Value<T>;

  override readonly length = 1;

  constructor({
    value,
    ...superParameters
  }: { focusResource: Resource; propertyPath: PropertyPath; value: Value<T> }) {
    super(superParameters);
    this.value = value;
  }

  override *[Symbol.iterator](): Iterator<Value<T>> {
    yield this.value;
  }

  override toArray(): readonly Value<T>[] {
    return [this.value];
  }
}
