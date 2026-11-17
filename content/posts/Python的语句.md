---
title: Python的语句
date: '2021-12-01 13:35:00'
category: 学习
tags:
  - python
series: Python 核心基础
draft: false
---

* 本文参考
\[1] [官方 Python3 教程](https://docs.python.org/zh-cn/3/)
\[2] [RUNOOB Python3 教程](https://www.runoob.com/python3/python3-tutorial.html)

# Python的语句

## 条件控制语句

### if语句

```python
if condition_1:
    statement_1
elif condition_2:
    statement_2
else:
    statement_3
```

### match语句（3.10新特性）

```python
match var:
    case var1:
        statement_1
    case var2 if condition:
        statement_2
    case var3|var4|var5:
        statement_3
```

## 循环语句

### for 循环

```python
for i in range(n):
    statement_1
else:
    statement_2
```

### while 循环

```python
while condition:
    statement_1
else:
    statement_2
```

### break语句和continue语句

```python
for i in range(n):
    if condition:
        statement_1
        continue
    else:
        statement_2
        break
```

### pass语句

```python
while condition:
    statement_1
    pass
```

## 异常语句

### 异常处理

```python
try:
    statement_1
except XxxError:
    statement_2
else:
    statement_3
finally:
    statement_4
```

### 触发异常

```python
assert condition
```

```python
if not condition:
    raise XxxError
```

当 XxxError 为 AssertionError 时，上述两者等价。 

## 命名空间和作用域控制

命名空间是变量名到对象的映射。

命名空间主要有三种：

1. Built-in
2. Global
3. Local

作用域是可以直接访问到命名空间的区域。

作用域主要有四种：

1. Built-in
2. Global
3. Enclosing
4. Local

```python
global_var = 0  # Global 作用域
def enclosing_fun():
    # Enclosing 作用域
    enclosing_var = 0
    def local_fun():
        # Local 作用域
        local_var = 0
```

对于同一变量，访问顺序为当前作用域由下至上（Local、Enclosing、Global、Built-in）。

我认为命名空间仅仅是一种逻辑空间的映射，不具有物理意义；而作用域可以体现在代码块的嵌套关系上，也可以体现逻辑空间映射，但具有物理意义。

### global & nonlocal

这个例子演示了如何引用不同作用域和名称空间：

```python
def scope_test():
    def do_local():
        spam = "local spam"

    def do_nonlocal():
        nonlocal spam
        spam = "nonlocal spam"

    def do_global():
        global spam
        spam = "global spam"

    spam = "test spam"
    do_local()
    print("After local assignment:", spam)
    do_nonlocal()
    print("After nonlocal assignment:", spam)
    do_global()
    print("After global assignment:", spam)

scope_test()
print("In global scope:", spam)
```

这段代码的输出：

```
After local assignment: test spam
After nonlocal assignment: nonlocal spam
After global assignment: nonlocal spam
In global scope: global spam
```

解释：

1. 输出1没有受到 `do_local()` 的影响是因为 local 作用域的变量无法直接影响 enclosing 作用域。
2. 输出2受到了 `do_nonlocal()` 的影响是因为 `nonlocal spam` 语句赋予了 local 作用域的 spam 影响 enclosing 作用域的能力。
3. 输出4受到了 `do_global()` 的影响是因为 `global spam` 语句赋予了 local 作用域的 spam 影响 global 作用域的能力，而输出3没有受到 `do_global()` 的影响是因为 `global spam` 语句没有赋予其直接影响 enclosing 作用域的能力，而 enclosing 作用域的优先级别高于 global 作用域。

不使用 global & nonlocal 可以用如下方式控制变量的流动：

```python
def fun(x) -> int:
    x = x + 1
    return x
x = 0
x = fun(x)
print(x)
```

使用 global & nonlocal 可以用如下方式控制变量的流动：

```python
def fun():
    global x
    x = x + 1
x = 0
fun()
print(x)
```

## del&with&yield（待续）
