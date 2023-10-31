// packages/shared/src/index.ts
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/reactivity/src/effectScope.ts
var activeEffectScope;
function recordEffectScope(effect4) {
  if (activeEffectScope && activeEffectScope.active) {
    activeEffectScope.effects.push(effect4);
  }
}

// packages/reactivity/src/effect.ts
function cleanupEffect(effect4) {
  let { deps } = effect4;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect4);
  }
  effect4.deps.length = 0;
}
var activeEffect;
var ReactiveEffect = class {
  constructor(fn, scheduler) {
    this.deps = [];
    this.parent = void 0;
    this.active = true;
    this.fn = fn;
    this.scheduler = scheduler;
    recordEffectScope(this);
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    try {
      this.parent = activeEffect;
      activeEffect = this;
      cleanupEffect(this);
      return this.fn();
    } finally {
      activeEffect = this.parent;
      this.parent = void 0;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
    }
  }
};
function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.run();
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}
var targetMap = /* @__PURE__ */ new WeakMap();
function track(target, key) {
  if (!activeEffect) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = /* @__PURE__ */ new Set());
  }
  trackEffects(dep);
}
function trackEffects(dep) {
  let shouldTrack = !dep.has(activeEffect);
  if (shouldTrack) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap)
    return;
  const dep = depsMap.get(key);
  triggerEffects(dep);
}
function triggerEffects(dep) {
  if (dep) {
    const effects = [...dep];
    effects.forEach((effect4) => {
      if (activeEffect !== effect4) {
        if (!effect4.scheduler) {
          effect4.run();
        } else {
          effect4.scheduler();
        }
      }
    });
  }
}

// packages/reactivity/src/baseHandlers.ts
var mutableHandlers = {
  get(target, key, receiver) {
    if ("__v_isReactive" /* IS_REACTIVE */ === key) {
      return true;
    }
    track(target, key);
    let r = Reflect.get(target, key, receiver);
    if (isObject(r)) {
      return reactive(r);
    }
    return r;
  },
  set(target, key, value, receiver) {
    let oldValue = target[key];
    const r = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      trigger(target, key, value, oldValue);
    }
    return r;
  }
};

// packages/reactivity/src/reactive.ts
function isReactive(target) {
  return !!(target && target["__v_isReactive" /* IS_REACTIVE */]);
}
var reactiveMap = /* @__PURE__ */ new WeakMap();
function reactive(target) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_isReactive" /* IS_REACTIVE */]) {
    return target;
  }
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }
  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

// packages/reactivity/src/ref.ts
function ref(value) {
  return new RefImpl(value);
}
function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}
var RefImpl = class {
  constructor(rawValue) {
    this.rawValue = rawValue;
    this.deps = void 0;
    this.__v_isRef = true;
    this._value = toReactive(rawValue);
  }
  get value() {
    if (activeEffect) {
      trackEffects(this.deps || (this.deps = /* @__PURE__ */ new Set()));
    }
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue);
      this.rawValue = newValue;
      triggerEffects(this.deps);
    }
  }
};

// packages/reactivity/src/watch.ts
function watch(source, cb, options) {
  doWatch(source, cb, options);
}
function watchEffect(effect4, options) {
  doWatch(effect4, null, options);
}
function doWatch(source, cb, { immediate } = {}) {
  let getter;
  if (isReactive(source)) {
    getter = () => traverse(source);
  } else if (isFunction(source)) {
    getter = source;
  }
  let oldValue;
  let cleanup;
  function onCleanup(userCb) {
    cleanup = userCb;
  }
  const job = () => {
    if (cb) {
      let newValue = effect4.run();
      if (cleanup)
        cleanup();
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      effect4.run();
    }
  };
  const effect4 = new ReactiveEffect(getter, job);
  if (immediate) {
    return job();
  }
  oldValue = effect4.run();
}
function traverse(source, s = /* @__PURE__ */ new Set()) {
  if (!isObject(source))
    return source;
  if (s.has(source))
    return source;
  s.add(source);
  for (let key in source) {
    traverse(source[key], s);
  }
  return source;
}

// packages/reactivity/src/computed.ts
var noop = () => {
};
function computed(source) {
  let onlyGetter = isFunction(source);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = source;
    setter = noop;
  } else {
    getter = source.get;
    setter = source.set || noop;
  }
  return new ComputedRefImpl(getter, setter);
}
var ComputedRefImpl = class {
  constructor(getter, setter) {
    this.setter = setter;
    this.dep = void 0;
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      this._dirty = true;
      triggerEffects(this.dep);
    });
  }
  get value() {
    if (activeEffect) {
      trackEffects(this.dep || (this.dep = /* @__PURE__ */ new Set()));
    }
    if (this._dirty) {
      this._value = this.effect.run();
      this._dirty = false;
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
};
export {
  computed,
  effect,
  reactive,
  ref,
  watch,
  watchEffect
};
//# sourceMappingURL=reactivity.esm.js.map
