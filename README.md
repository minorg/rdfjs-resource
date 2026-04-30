> ⚠️ **Deprecated.** This project has been merged into [rdfx](github.com/minorg/rdfx) as `@rdfx/resource`.

# rdfjs-resource

Resource abstraction over [RDF/JS Datasets](https://rdf.js.org/dataset-spec/), inspired by similar abstractions in 

* [Apache Jena](https://www.javadoc.io/doc/org.apache.jena/jena-core/3.3.0/org/apache/jena/rdf/model/Resource.html)
* [rdflib](https://rdflib.readthedocs.io/en/stable/_modules/rdflib/resource.html)
* [Sophia](https://crates.io/crates/sophia_resource)

## Installation

```
npm i rdfjs-resource
```

## Usage

### Wrap an RDF/JS `BlankNode` or `NamedNode` in a `Resource`

```
const resource = new Resource(dataset, identifier);
```

### Retrieve a value (object) of the `Resource`

```
import { rdf } from "@tpluscode/rdf-ns-builders";

const value = resource.value(rdf.type).toNumber().orDefault(0);
```

`Resource.value(predicate)` and `Resource.values(predicate)` return a `Resource.TermValue`, which has various `to` conversion methods that return [purify-ts](https://gigobyte.github.io/purify/) `Either` monads.

See the `Resource.test.ts` for additional usage.

### `ResourceSet`

For convenience, you can wrap a `DatasetCore` in a `ResourceSet`, then instantiate `Resource`s from that:

```
const resourceSet = new ResourceSet(dataset);
resourceSet.resource(identifier).value(rdf.type);
```
