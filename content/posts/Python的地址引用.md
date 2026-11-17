---
title: Python的地址引用
date: '2023-01-15 19:38:00'
category: 学习
tags:
  - python
series: Python 核心基础
draft: false
---

# Python 地址引用

## 数值、列表地址

**被赋值对象不涉及索引的：**对被赋值对象来说是直接引用

```python
# 数值
>>> x = 1
>>> y = x
>>> x = 2
>>> y
1

# 字符串
>>> str_a = 'hello'
>>> str_b = str_a
>>> str_a = str_a[:2]
>>> str_a
'he'
>>> str_b
'hello'

# 列表
>>> list_a = [[1, 2], [3, 4]]
>>> list_b = list_a
>>> list_a = [[1, 2], [3, 5]]
>>> list_b
[[1, 2], [3, 4]]
```

**被赋值对象涉及索引的：**对被赋值对象来说是间接引用

```python
>>> list_a = [[1, 2], [3, 4]]
>>> list_b = list_a
>>> list_a[0] = [1]
>>> list_b
[[1], [3, 4]]
```

## 函数地址

```python
>>> def func():
...     return 0
...

>>> func
<function func at 0x00000254E026B158>

>>> func()
0

>>> id(func)
2563561140568
>>> id(func())
1760324608
>>> id(0)
1760324608

>>> func_x = func
>>> func_y = func
>>> id(func_x)
2563561140568
>>> id(func_y)
2563561140568

>>> def func_():
...     return 0
...

>>> id(func_)
2563561119528
>>> id(func_())
1760324608

>>> func = func_
>>> id(func)
2563561119528
>>> id(func_x)
2563561140568
>>> id(func_y)
2563561140568
```

1.  `func` 会在程序中返回函数存储的内存地址，位置固定。
2.  `func_x = func` 会将 `func` 的内存地址直接赋给 `func_x`，此时 `func` 和 `func_x` 只有命名的不同，指向的位置完全一样。
3.  对于逻辑完全相同但定义两次的两个函数，程序会为他们赋予不同的内存地址。
4.  由于 `func_x = func` 过程是直接引用，运行 `func = func_` 后，`func_x` 指向不变。

## 问题

1.  不要使用 `def func(a = [])` ，多次调用时会出现 a 不被初始化的现象，尚未找出原因。