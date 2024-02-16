import * as mc from '@minecraft/server';

if(!mc.Container.prototype[Symbol.iterator]) mc.Container.prototype[Symbol.iterator] = function*() {
    for(let i = 0; i < this.size; ++i) {
        yield this.getItem(i);
    }
}
