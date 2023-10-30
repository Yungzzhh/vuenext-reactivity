### vue3

#### 响应式
通过proxy的get和set方法对对象内的属性进行拦截
track对依赖进行收集
trigger触发更新
执行effect时，将执行函数传入，实例化ReactiveEffect ===》 
执行.run ===》 
由于在run方法中，全局唯一的activeEffect被赋值为当前的ReactiveEffect实例 并执行内部的函数 ===》
触发get和里面的track方法，进行了依赖收集 ===》
在**targetMap**这个WeakMap中以target 为key 、以（key：[ ReactiveEffect, ReactiveEffect2 ]）为 value

后续如果更改属性将触发set方法，从 **targetMap** 中获取需要触发的effects，遍历并执行实例的run方法，更新内容

#### 模板渲染

#### 其余api的实现

#### diff
