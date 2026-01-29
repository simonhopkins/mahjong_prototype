/**
 * A utility class providing static methods for common Set operations
 */
export default class SetHelpers {
    /**
     * Returns the union of two or more sets (all elements from all sets)
     * @example SetHelper.union(new Set([1, 2]), new Set([2, 3])) // Set(1, 2, 3)
     */
    static union<T>(...sets: Set<T>[]): Set<T> {
        const result = new Set<T>();
        for (const set of sets) {
            for (const item of set) {
                result.add(item);
            }
        }
        return result;
    }

    /**
     * Returns the intersection of two or more sets (elements common to all sets)
     * @example SetHelper.intersection(new Set([1, 2, 3]), new Set([2, 3, 4])) // Set(2, 3)
     */
    static intersection<T>(...sets: Set<T>[]): Set<T> {
        if (sets.length === 0) return new Set<T>();
        if (sets.length === 1) return new Set(sets[0]);

        const result = new Set(sets[0]);

        for (const item of result) {
            for (let i = 1; i < sets.length; i++) {
                if (!sets[i].has(item)) {
                    result.delete(item);
                    break;
                }
            }
        }

        return result;
    }

    /**
     * Returns the difference between the first set and all other sets (elements in first set but not in others)
     * @example SetHelper.difference(new Set([1, 2, 3]), new Set([2, 3, 4])) // Set(1)
     */
    static difference<T>(set: Set<T>, ...otherSets: Set<T>[]): Set<T> {
        const result = new Set(set);

        for (const otherSet of otherSets) {
            for (const item of otherSet) {
                result.delete(item);
            }
        }

        return result;
    }

    /**
     * Returns the symmetric difference of two sets (elements in either set but not in both)
     * @example SetHelper.symmetricDifference(new Set([1, 2, 3]), new Set([2, 3, 4])) // Set(1, 4)
     */
    static symmetricDifference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
        const result = new Set<T>();

        for (const item of setA) {
            if (!setB.has(item)) {
                result.add(item);
            }
        }

        for (const item of setB) {
            if (!setA.has(item)) {
                result.add(item);
            }
        }

        return result;
    }

    /**
     * Checks if setA is a subset of setB (all elements of setA are in setB)
     * @example SetHelper.isSubset(new Set([1, 2]), new Set([1, 2, 3])) // true
     */
    static isSubset<T>(setA: Set<T>, setB: Set<T>): boolean {
        for (const item of setA) {
            if (!setB.has(item)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if setA is a superset of setB (all elements of setB are in setA)
     * @example SetHelper.isSuperset(new Set([1, 2, 3]), new Set([1, 2])) // true
     */
    static isSuperset<T>(setA: Set<T>, setB: Set<T>): boolean {
        return this.isSubset(setB, setA);
    }

    /**
     * Checks if two sets are disjoint (have no elements in common)
     * @example SetHelper.isDisjoint(new Set([1, 2]), new Set([3, 4])) // true
     */
    static isDisjoint<T>(setA: Set<T>, setB: Set<T>): boolean {
        for (const item of setA) {
            if (setB.has(item)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if two sets are equal (contain exactly the same elements)
     * @example SetHelper.isEqual(new Set([1, 2, 3]), new Set([3, 2, 1])) // true
     */
    static isEqual<T>(setA: Set<T>, setB: Set<T>): boolean {
        if (setA.size !== setB.size) return false;
        return this.isSubset(setA, setB);
    }

    /**
     * Returns the cartesian product of two sets
     * @example SetHelper.cartesianProduct(new Set([1, 2]), new Set(['a', 'b']))
     * // Set([1, 'a'], [1, 'b'], [2, 'a'], [2, 'b'])
     */
    static cartesianProduct<T, U>(setA: Set<T>, setB: Set<U>): Set<[T, U]> {
        const result = new Set<[T, U]>();

        for (const a of setA) {
            for (const b of setB) {
                result.add([a, b]);
            }
        }

        return result;
    }

    /**
     * Returns the power set of a set (all possible subsets)
     * @example SetHelper.powerSet(new Set([1, 2])) // Set(Set(), Set(1), Set(2), Set(1, 2))
     */
    static powerSet<T>(set: Set<T>): Set<Set<T>> {
        const result = new Set<Set<T>>();
        const array = Array.from(set);
        const combinations = 1 << array.length; // 2^n combinations

        for (let i = 0; i < combinations; i++) {
            const subset = new Set<T>();
            for (let j = 0; j < array.length; j++) {
                if (i & (1 << j)) {
                    subset.add(array[j]);
                }
            }
            result.add(subset);
        }

        return result;
    }

    /**
     * Filters a set based on a predicate function
     * @example SetHelper.filter(new Set([1, 2, 3, 4]), x => x % 2 === 0) // Set(2, 4)
     */
    static filter<T>(set: Set<T>, predicate: (value: T) => boolean): Set<T> {
        const result = new Set<T>();

        for (const item of set) {
            if (predicate(item)) {
                result.add(item);
            }
        }

        return result;
    }

    /**
     * Maps a set to a new set using a transformation function
     * @example SetHelper.map(new Set([1, 2, 3]), x => x * 2) // Set(2, 4, 6)
     */
    static map<T, U>(set: Set<T>, mapper: (value: T) => U): Set<U> {
        const result = new Set<U>();

        for (const item of set) {
            result.add(mapper(item));
        }

        return result;
    }

    /**
     * Partitions a set into two sets based on a predicate
     * @example SetHelper.partition(new Set([1, 2, 3, 4]), x => x % 2 === 0)
     * // [Set(2, 4), Set(1, 3)]
     */
    static partition<T>(
        set: Set<T>,
        predicate: (value: T) => boolean
    ): [Set<T>, Set<T>] {
        const truthy = new Set<T>();
        const falsy = new Set<T>();

        for (const item of set) {
            if (predicate(item)) {
                truthy.add(item);
            } else {
                falsy.add(item);
            }
        }

        return [truthy, falsy];
    }

    /**
     * Converts an array to a set
     * @example SetHelper.fromArray([1, 2, 2, 3]) // Set(1, 2, 3)
     */
    static fromArray<T>(array: T[]): Set<T> {
        return new Set(array);
    }

    /**
     * Converts a set to an array
     * @example SetHelper.toArray(new Set([1, 2, 3])) // [1, 2, 3]
     */
    static toArray<T>(set: Set<T>): T[] {
        return Array.from(set);
    }
}

