import { isFunction, isObject } from "@vue/shared";
import { isReactive } from "./reactive";
import { ReactiveEffect, effect } from "./effect";


// 两者都基于effect实现，watch时在自定义的scheduler中执行cb，watchEffect则是在
export function watch(source, cb, options) {
    doWatch(source, cb, options)
}

export function watchEffect(effect, options) {
    doWatch(effect, null, options)
}

function doWatch(source, cb, {immediate} = {} as any) {
    let getter;
    // watch的第一个参数是对象时，必须是响应式的
    if(isReactive(source)) {
        getter = () => traverse(source) // 用函数包装一下，后续配合effect的return this.fn()执行释放对象
    } else if (isFunction(source)) {
        getter = source
    }
    
    let oldValue;
    let cleanup;

    function onCleanup(userCb) {
        cleanup = userCb
    }

    // watcher effect 的依赖变化时，就会执行scheduler（即job）在trigger！！！！！
    const job = () => {
        // 2、cb则是watch在scheduler中调用cb
        if(cb) {
            let newValue = effect.run() // this.fn就是传入的函数
            
            if(cleanup) cleanup()
            cb(newValue, oldValue, onCleanup)
            oldValue = newValue
        } else {
            effect.run()
        }
    }
    const effect = new ReactiveEffect(getter, job)

    if(immediate) {
        return job()
    }

    oldValue = effect.run() // 1、执行getter，收集依赖 ！！！first！！！
}

// 深度监听
function traverse(source, s = new Set()) {
    if(!isObject(source)) return source

    if(s.has(source)) return source

    s.add(source)

    for(let key in source) {
        traverse(source[key], s)
    }

    return source
}

