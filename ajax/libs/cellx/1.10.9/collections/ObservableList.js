import { EventEmitter } from '../EventEmitter';
const push = Array.prototype.push;
const splice = Array.prototype.splice;
const defaultItemComparator = (a, b) => {
    return a < b ? -1 : a > b ? 1 : 0;
};
export class ObservableList extends EventEmitter {
    constructor(items, options) {
        super();
        this._items = [];
        if (options) {
            if (options.itemEquals) {
                this._itemEquals = options.itemEquals;
            }
            if ((options.itemComparator && options.sorted !== false) || options.sorted) {
                this._itemComparator = options.itemComparator || defaultItemComparator;
                this._sorted = true;
            }
            else {
                this._itemComparator = null;
                this._sorted = false;
            }
        }
        if (items) {
            if (this._sorted) {
                if (items instanceof ObservableList) {
                    items = items._items;
                }
                for (let i = 0, l = items.length; i < l; i++) {
                    this._insertSortedValue(items[i]);
                }
            }
            else {
                push.apply(this._items, items instanceof ObservableList ? items._items : items);
            }
        }
    }
    get length() {
        return this._items.length;
    }
    set length(value) {
        if (this._items.length != value) {
            if (value > this._items.length) {
                throw RangeError('Length out of valid range');
            }
            this.emit(ObservableList.EVENT_CHANGE);
            this._items.length = value;
        }
    }
    get itemEquals() {
        return this._itemEquals;
    }
    get itemComparator() {
        return this._itemComparator;
    }
    get sorted() {
        return this._sorted;
    }
    onChange(listener, context) {
        return this.on(ObservableList.EVENT_CHANGE, listener, context);
    }
    offChange(listener, context) {
        return this.off(ObservableList.EVENT_CHANGE, listener, context);
    }
    _validateIndex(index, allowEndIndex = false) {
        if (index === undefined) {
            return index;
        }
        if (index < 0) {
            index += this._items.length;
            if (index < 0) {
                throw RangeError('Index out of valid range');
            }
        }
        else if (index > this._items.length - (allowEndIndex ? 0 : 1)) {
            throw RangeError('Index out of valid range');
        }
        return index;
    }
    contains(item) {
        return this._items.indexOf(item) != -1;
    }
    indexOf(item, fromIndex) {
        return this._items.indexOf(item, this._validateIndex(fromIndex, true));
    }
    lastIndexOf(item, fromIndex) {
        return this._items.lastIndexOf(item, fromIndex === undefined ? -1 : this._validateIndex(fromIndex, true));
    }
    get(index) {
        return this._items[this._validateIndex(index, true)];
    }
    getRange(index, count) {
        index = this._validateIndex(index, true);
        if (count === undefined) {
            return this._items.slice(index);
        }
        if (index + count > this._items.length) {
            throw RangeError('Sum of "index" and "count" out of valid range');
        }
        return this._items.slice(index, index + count);
    }
    set(index, item) {
        if (this._sorted) {
            throw TypeError('Cannot set to sorted list');
        }
        index = this._validateIndex(index, true);
        if (!Object.is(item, this._items[index])) {
            this._items[index] = item;
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return this;
    }
    setRange(index, items) {
        if (this._sorted) {
            throw TypeError('Cannot set to sorted list');
        }
        index = this._validateIndex(index, true);
        if (items instanceof ObservableList) {
            items = items._items;
        }
        let itemCount = items.length;
        if (!itemCount) {
            return this;
        }
        let listItems = this._items;
        if (index + itemCount > listItems.length) {
            throw RangeError('Sum of "index" and "items.length" out of valid range');
        }
        let changed = false;
        for (let i = index + itemCount; i > index;) {
            let item = items[--i - index];
            if (!Object.is(item, listItems[i])) {
                listItems[i] = item;
                changed = true;
            }
        }
        if (changed) {
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return this;
    }
    add(item, unique = false) {
        if (unique && this._items.indexOf(item) != -1) {
            return this;
        }
        if (this._sorted) {
            this._insertSortedValue(item);
        }
        else {
            this._items.push(item);
        }
        this.emit(ObservableList.EVENT_CHANGE);
        return this;
    }
    addRange(items, unique = false) {
        if (items instanceof ObservableList) {
            items = items._items;
        }
        if (items.length) {
            if (unique) {
                let listItems = this._items;
                let sorted = this._sorted;
                let changed = false;
                for (let item of items) {
                    if (listItems.indexOf(item) == -1) {
                        if (sorted) {
                            this._insertSortedValue(item);
                        }
                        else {
                            listItems.push(item);
                        }
                        changed = true;
                    }
                }
                if (changed) {
                    this.emit(ObservableList.EVENT_CHANGE);
                }
            }
            else {
                if (this._sorted) {
                    for (let i = 0, l = items.length; i < l; i++) {
                        this._insertSortedValue(items[i]);
                    }
                }
                else {
                    push.apply(this._items, items);
                }
                this.emit(ObservableList.EVENT_CHANGE);
            }
        }
        return this;
    }
    insert(index, item) {
        if (this._sorted) {
            throw TypeError('Cannot insert to sorted list');
        }
        this._items.splice(this._validateIndex(index, true), 0, item);
        this.emit(ObservableList.EVENT_CHANGE);
        return this;
    }
    insertRange(index, items) {
        if (this._sorted) {
            throw TypeError('Cannot insert to sorted list');
        }
        index = this._validateIndex(index, true);
        if (items instanceof ObservableList) {
            items = items._items;
        }
        if (items.length) {
            splice.apply(this._items, [index, 0].concat(items));
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return this;
    }
    remove(item, fromIndex) {
        let index = this._items.indexOf(item, this._validateIndex(fromIndex, true));
        if (index == -1) {
            return false;
        }
        this._items.splice(index, 1);
        this.emit(ObservableList.EVENT_CHANGE);
        return true;
    }
    removeAll(item, fromIndex) {
        let index = this._validateIndex(fromIndex, true);
        let items = this._items;
        let changed = false;
        while ((index = items.indexOf(item, index)) != -1) {
            items.splice(index, 1);
            changed = true;
        }
        if (changed) {
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return changed;
    }
    removeEach(items, fromIndex) {
        fromIndex = this._validateIndex(fromIndex, true);
        if (items instanceof ObservableList) {
            items = items._items.slice();
        }
        let listItems = this._items;
        let changed = false;
        for (let i = 0, l = items.length; i < l; i++) {
            let index = listItems.indexOf(items[i], fromIndex);
            if (index != -1) {
                listItems.splice(index, 1);
                changed = true;
            }
        }
        if (changed) {
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return changed;
    }
    removeAt(index) {
        let item = this._items.splice(this._validateIndex(index), 1)[0];
        this.emit(ObservableList.EVENT_CHANGE);
        return item;
    }
    removeRange(index, count) {
        index = this._validateIndex(index, true);
        if (count === undefined) {
            count = this._items.length - index;
            if (!count) {
                return [];
            }
        }
        else {
            if (!count) {
                return [];
            }
            if (index + count > this._items.length) {
                throw RangeError('Sum of "index" and "count" out of valid range');
            }
        }
        let removedItems = this._items.splice(index, count);
        this.emit(ObservableList.EVENT_CHANGE);
        return removedItems;
    }
    replace(oldValue, newValue) {
        if (this._sorted) {
            throw TypeError('Cannot replace in sorted list');
        }
        let index = this._items.indexOf(oldValue);
        if (index != -1) {
            this._items[index] = newValue;
            this.emit(ObservableList.EVENT_CHANGE);
            return true;
        }
        return false;
    }
    clear() {
        if (this._items.length) {
            this._items.length = 0;
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return this;
    }
    equals(that) {
        if (!(that instanceof ObservableList)) {
            return false;
        }
        let items = this._items;
        let thatItems = that._items;
        if (items.length != thatItems.length) {
            return false;
        }
        for (let i = items.length; i;) {
            let item = items[--i];
            let thatItem = thatItems[i];
            if (this._itemEquals
                ? !this._itemEquals(item, thatItem)
                : item !== thatItem &&
                    !(item &&
                        thatItem &&
                        typeof item == 'object' &&
                        typeof thatItem == 'object' &&
                        item.equals &&
                        item.equals ===
                            thatItem.equals &&
                        item.equals(thatItem))) {
                return false;
            }
        }
        return true;
    }
    join(separator) {
        return this._items.join(separator);
    }
    find(cb, context) {
        let items = this._items;
        for (let i = 0, l = items.length; i < l; i++) {
            let item = items[i];
            if (cb.call(context, item, i, this)) {
                return item;
            }
        }
        return;
    }
    findIndex(cb, context) {
        let items = this._items;
        for (let i = 0, l = items.length; i < l; i++) {
            if (cb.call(context, items[i], i, this)) {
                return i;
            }
        }
        return -1;
    }
    clone(deep = false) {
        return new this.constructor(deep
            ? this._items.map((item) => item && typeof item == 'object' && item.clone
                ? item.clone(true)
                : item)
            : this, {
            itemComparator: this._itemComparator || undefined,
            sorted: this._sorted
        });
    }
    absorbFrom(that) {
        if (!(that instanceof ObservableList)) {
            throw TypeError('"that" must be instance of ObservableList');
        }
        let items = this._items;
        let thatItems = that._items;
        let changed = false;
        if (items.length != that.length) {
            items.length = that.length;
            changed = true;
        }
        for (let i = items.length; i;) {
            let item = items[--i];
            let thatItem = thatItems[i];
            if (this._itemEquals
                ? !this._itemEquals(item, thatItem)
                : item !== thatItem &&
                    !(item &&
                        thatItem &&
                        typeof item == 'object' &&
                        typeof thatItem == 'object' &&
                        item.equals &&
                        item.equals ===
                            thatItem.equals &&
                        item.equals(thatItem))) {
                if (item &&
                    thatItem &&
                    typeof item == 'object' &&
                    typeof thatItem == 'object' &&
                    item.absorbFrom &&
                    item.absorbFrom === thatItem.absorbFrom) {
                    if (item.absorbFrom(thatItem)) {
                        changed = true;
                    }
                }
                else {
                    items[i] = thatItem;
                    changed = true;
                }
            }
        }
        if (changed) {
            this.emit(ObservableList.EVENT_CHANGE);
        }
        return changed;
    }
    toArray() {
        return this._items.slice();
    }
    toString() {
        return this._items.join();
    }
    toData() {
        return this._items.map((item) => item && typeof item == 'object' && item.toData ? item.toData() : item);
    }
    _insertSortedValue(item) {
        let items = this._items;
        let itemComparator = this._itemComparator;
        let lowIndex = 0;
        let highIndex = items.length;
        while (lowIndex != highIndex) {
            let midIndex = (lowIndex + highIndex) >> 1;
            if (itemComparator(item, items[midIndex]) < 0) {
                highIndex = midIndex;
            }
            else {
                lowIndex = midIndex + 1;
            }
        }
        items.splice(lowIndex, 0, item);
    }
}
ObservableList.EVENT_CHANGE = 'change';
['forEach', 'map', 'filter', 'every', 'some'].forEach((name) => {
    ObservableList.prototype[name] = function (cb, context) {
        return this._items[name]((item, index) => cb.call(context, item, index, this));
    };
});
['reduce', 'reduceRight'].forEach((name) => {
    ObservableList.prototype[name] = function (cb, initialValue) {
        let wrapper = (accumulator, item, index) => cb(accumulator, item, index, this);
        return arguments.length >= 2
            ? this._items[name](wrapper, initialValue)
            : this._items[name](wrapper);
    };
});
[
    ['keys', (index) => index],
    ['values', (_index, item) => item],
    ['entries', (index, item) => [index, item]]
].forEach((settings) => {
    let getStepValue = settings[1];
    ObservableList.prototype[settings[0]] = function () {
        let items = this._items;
        let index = 0;
        let done = false;
        return {
            next() {
                if (!done) {
                    if (index < items.length) {
                        return {
                            value: getStepValue(index, items[index++]),
                            done: false
                        };
                    }
                    done = true;
                }
                return {
                    value: undefined,
                    done: true
                };
            }
        };
    };
});
ObservableList.prototype[Symbol.iterator] = ObservableList.prototype.values;
