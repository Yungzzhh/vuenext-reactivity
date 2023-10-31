import { isFunction } from "@vue/shared";
import { ReactiveEffect, activeEffect, effect, trackEffects, triggerEffects } from './effect';

const noop = () => {};
export function computed(source) {
    let onlyGetter = isFunction(source)
    let getter 
    let setter
    if(onlyGetter) {
        getter = source
        setter = noop
    } else {
        getter = source.get;
        setter = source.set || noop;
    }

    return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl {
    effect;
    _value // 缓存结果
    dep = undefined;
    _dirty = true // 是否需要重新计算
    constructor(getter, public setter) {
        // 属性更新时，触发trigger重新执行effect，但是不执行run，而是执行scheduler，将dirty设为true，下次取值时重新计算
        this.effect = new ReactiveEffect(getter, () => {
            this._dirty = true
            triggerEffects(this.dep)
        })
    }
    get value() {
        if(activeEffect) {
            trackEffects(this.dep || (this.dep = new Set()))
        }
        if(this._dirty) {
            this._value = this.effect.run() // 取值时执行effect并缓存结果，dirty切换
            this._dirty = false
        }
        return this._value
    }

    set value(newValue) {
        this.setter(newValue)
    }
}