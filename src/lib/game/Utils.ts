/**
 * Helper function to determine whether or not a key is a keyof a given object. This helps with
 * suppressing eslint errors when trying to key an object with a variable.
 * 
 * By doing a check for:
 *    if (isObjKey(key, object))
 * we can ensure that eslint won't warn us about keying an object with an invalid type.
 * 
 * @method isObjKey
 * @param {any} key The key to check the keyof with.
 * @param {T} obj The generic type object to check if the given key exists in.
 * @return True if the given key is a keyof the given object, false otherwise. The return value
 * when captured in a conditional also suppresses eslint warnings when trying to key into an object
 * for which there is no indexing type scheme. (Ex: { [key: string]: string } type or other.)
 */
function isObjKey<T>(key: any, obj: T): key is keyof T {
  return key in obj;
}

export { isObjKey as default };