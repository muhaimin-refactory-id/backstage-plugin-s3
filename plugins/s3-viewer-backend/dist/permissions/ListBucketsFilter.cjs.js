'use strict';

const matches = (bucket, filters) => {
  if (!filters) {
    return true;
  }
  if ("allOf" in filters) {
    return filters.allOf.every((filter) => matches(bucket, filter));
  }
  if ("anyOf" in filters) {
    return filters.anyOf.some((filter) => matches(bucket, filter));
  }
  if ("not" in filters) {
    return !matches(bucket, filters.not);
  }
  return filters.values.includes(bucket[filters.property]);
};

exports.matches = matches;
//# sourceMappingURL=ListBucketsFilter.cjs.js.map
