import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandlers";


export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive",
}

export function isReactive(target) {
    return !!(target && target[ReactiveFlags.IS_REACTIVE]);
}

const reactiveMap = new WeakMap(); // 防止内存泄漏

export function reactive(target) {
    // 只代理对象
    if(!isObject(target)) {
        return target
    }
    // 如果已经被代理过，则返回
    // 如果target被代理过，则会走get函数，返回true
    if(target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }
    // 不重复代理同一对象
    const existProxy = reactiveMap.get(target);
    if(existProxy) {
        return existProxy
    }
    // 创建代理
    const proxy = new Proxy(target, mutableHandlers)
    reactiveMap.set(target, proxy); // target -> proxy 的映射表
    return proxy
}