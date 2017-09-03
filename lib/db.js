const fs = require('fs');
const extend = require('extend');

const copy = data => extend(true, {}, {c: data}).c;

class Table {
    constructor(dbName, tableName) {
        if (!tableName || !dbName) {
            throw 'tableName and dbName are required.';
        }

        this._data = [];
        this._dbName = dbName;
        this._tableName = tableName;
    }

    _find(criteria, limit, cb) {
        if (!cb) {
            return;
        }

        let found = 0;
        criteria = criteria || {};
        limit = limit || Infinity;

        for (let i = 0; i < this._data.length; i++) {
            const tableItem = this._data[i];
            let match = true;

            for (const criteriaKey in criteria) {
                if (criteria.hasOwnProperty(criteriaKey)) {
                    if (tableItem[criteriaKey] !== criteria[criteriaKey]) {
                        match = false;
                        break;
                    }
                }
            }

            if (match) {
                cb(tableItem, i);

                if (++found === limit) {
                    break;
                }
            }
        }
    };

    select(criteria, limit) {
        if (!(criteria || limit)) {
            return copy(this._data);
        }

        const result = [];

        this._find(criteria, limit, tableItem => {
            result.push(tableItem);
        });

        return copy(result);
    };

    update(criteria, newValues) {
        criteria = criteria || {};
        newValues = newValues || {};

        this._find(criteria, Infinity, (tableItem, i) => {
            tableItem = extend(tableItem, newValues);

            this._data[i] = tableItem;
        });

        this.store();
    };

    insert() {
        for (let i = 0; i < arguments.length; i++) {
            this._data.push(arguments[i]);
        }

        this.store();
    };

    drop(criteria, limit) {
        criteria = criteria || {};

        this._find(criteria, limit, (tableItem, i) => {
            this._data.splice(i, 1);
        });

        this.store();
    };

    // clean() {
    //     this._data = [];
    //
    //     this.store();
    // };

    store() {
        clearTimeout(this._storeTimeout);

        this._storeTimeout = setTimeout(() => {
            fs.writeFile(`db/${this._dbName}.${this._tableName}`, JSON.stringify(this._data), {}, () => {
            });
        }, 0);
    };

    restore() {
        let data = [];

        if (fs.existsSync(`db/${this._dbName}.${this._tableName}`)) {
            data = JSON.parse(fs.readFileSync(`db/${this._dbName}.${this._tableName}`) || '[]');
        }

        this.insert.apply(this, data);
    };
}

class DB {
    constructor(dbName) {
        this._tables = {};
        this._dbName = dbName || '';
    }

    table(name) {
        if (this._tables[name]) {
            return this._tables[name];
        } else {
            const table = new Table(this._dbName, name);
            table.restore();
            return (this._tables[name] = table);
        }
    }
}

module.exports = new DB('app');
