import { isObject } from "@vue/shared"
import { reactive } from "./reactive"
import { activeEffect, trackEffects, triggerEffects } from "./effect"

export function ref(value) {
    return new RefImpl(value)
}

function toReactive(value) {
    return isObject(value) ? reactive(value) : value
}

class RefImpl {
    public _value
    public deps = undefined
    __v_isRef = true;
    constructor(public rawValue) {
        this._value = toReactive(rawValue)
    }

    get value() {
        // 依赖收集
        if(activeEffect) {
            trackEffects(this.deps || (this.deps = new Set()))
        }

        return this._value
    }

    set value(newValue) {
        if(newValue !== this.rawValue) {
            this._value = toReactive(newValue)
            this.rawValue = newValue

            // 触发更新
            triggerEffects(this.deps)
        }
    }
}

export function toRefs(object) {
    const ret = {}
    for(let key in object) {
        ret[key] = toRef(object, key)
    }
    return ret
}

export function toRef(target, key) {
    return new ObjectRefImpl(target, key)
}

class ObjectRefImpl {
    __v_isRef = true;
    constructor(public _object, public _key) {}
    get value() {
        return this._object[this._key]
    }
    set value(newValue) {
        this._object[this._key] = newValue
    }
}

// 模板中读取ref的值时不需要.value, 用了proxyRefs，如果对象是Ref类型，则get和set代理到该属性的value上，如果不是则正常取值和设值
export function proxyRefs(objWithRefs) {
    return new Proxy(objWithRefs, {
        get(target, key, receive) {
            let v = Reflect.get(target, key, receive)
            return v.__v_isRef ? v.value : v;
        },
        set(target, key, value, receive) {
            const oldValue = target[key]
            if(oldValue.__v_isRef) {
                oldValue.value = value
                return true
            }
            return Reflect.set(target, key, value, receive)
        }
    })
}