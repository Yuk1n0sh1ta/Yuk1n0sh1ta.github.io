---
title: Python的函数
date: '2021-12-07 12:04:00'
category: 学习
tags:
  - python
series: Python 核心基础
draft: false
---

* 本文参考
\[1] [官方 Python3 教程](https://docs.python.org/zh-cn/3/)
\[2] [RUNOOB Python3 教程](https://www.runoob.com/python3/python3-tutorial.html)

# Python的函数

## 函数定义 def

```python
def f(arg1: str, arg2: int = 0 ) -> str:
    ......
    return arg1
```

## 函数参数定义

### 位置参数和关键字参数

```python
def parrot(voltage, state='a stiff', action='voom', type='Norwegian Blue'):
    print("-- This parrot wouldn't", action, end=' ')
    print("if you put", voltage, "volts through it.")
    print("-- Lovely plumage, the", type)
    print("-- It's", state, "!")
```

该函数接受一个必选参数（`voltage`）和三个可选参数（`state`, `action` 和 `type`）。该函数可用下列方式调用：

```python
parrot(1000)                                          # 1 positional argument
parrot(voltage=1000)                                  # 1 keyword argument
parrot(voltage=1000000, action='VOOOOOM')             # 2 keyword arguments
parrot(action='VOOOOOM', voltage=1000000)             # 2 keyword arguments
parrot('a million', 'bereft of life', 'jump')         # 3 positional arguments
parrot('a thousand', state='pushing up the daisies')  # 1 positional, 1 keyword
```

以下调用函数的方式都无效：

```python
parrot()                     # required argument missing
parrot(voltage=5.0, 'dead')  # non-keyword argument after a keyword argument
parrot(110, voltage=220)     # duplicate value for the same argument
parrot(actor='John Cleese')  # unknown keyword argument
```

参数设定的原则：

1. 函数定义时，必选参数在前，可选参数（带有默认值的参数）在后。

2. 调用函数时，位置参数（基于位置读取）在前，关键词参数（基于调用关键词读取）在后。
3. 不能对同一参数多次赋值（通过位置参数、关键词参数对同一参数赋值）

### 当单个参数为多变量或者键值对

```python
def cheeseshop(kind, *arguments, **keywords):
    print("-- Do you have any", kind, "?")
    print("-- I'm sorry, we're all out of", kind)
    for arg in arguments:
        print(arg)
    print("-" * 40)
    for kw in keywords:
        print(kw, ":", keywords[kw])
```

该函数可以用如下方式调用：

```python
cheeseshop("Limburger", "It's very runny, sir.",
           "It's really very, VERY runny, sir.",
           shopkeeper="Michael Palin",
           client="John Cleese",
           sketch="Cheese Shop Sketch")
```

输出结果如下：

```markdown
-- Do you have any Limburger ?
-- I'm sorry, we're all out of Limburger
It's very runny, sir.
It's really very, VERY runny, sir.
----------------------------------------
shopkeeper : Michael Palin
client : John Cleese
sketch : Cheese Shop Sketch
```

函数会自动将 `"Limburger"` 赋给 `kind`， 将 `("It's very runny, sir.", "It's really very, VERY runny, sir.")` 赋给 `*arguments`， 将 `{shopkeeper="Michael Palin", client="John Cleese", sketch="Cheese Shop Sketch"}` 赋给 `**keywords`。

单个参数为多变量或者键值对的函数设定原则：

1. `*name` 必须在 `**name` 前面

### 特殊参数

默认情况下，参数可以按位置或显式关键字传递给 Python 函数。为了让代码易读、高效，最好限制参数的传递方式，这样，开发者只需查看函数定义，即可确定参数项是仅按位置、按位置或关键字，还是仅按关键字传递。

函数定义如下：

```python
def f(pos1, pos2, /, pos_or_kwd, *, kwd1, kwd2):
      -----------    ----------     ----------
        |             |                  |
        |        Positional or keyword   |
        |                                - Keyword only
         -- Positional only
```

`/` 和 `*` 是可选的。这些符号表明形参如何把参数值传递给函数：位置、位置或关键字、关键字。关键字形参也叫作命名形参。

特殊参数的函数设定原则：

1. `/`之前的参数均为位置限定参数（只能通过位置赋值）
2. `*` 之后的参数均为关键词限定参数（只能通过关键词赋值）
3. `/` 和 `*` 之间的参数不限定赋值方式

函数调用要求独立的位置参数，但实参在列表或元组里时，要执行相反的操作。例如，内置的 [`range()`](https://docs.python.org/zh-cn/3/library/stdtypes.html#range) 函数要求独立的 *start* 和 *stop* 实参。如果这些参数不是独立的，则要在调用函数时，用 `*` 操作符把实参从列表或元组解包出来：

```python
>>> list(range(3, 6))            # normal call with separate arguments
[3, 4, 5]
>>> args = [3, 6]
>>> list(range(*args))            # call with arguments unpacked from a list
[3, 4, 5]
```

同样，字典可以用 `**` 操作符传递关键字参数：

```python
>>> def parrot(voltage, state='a stiff', action='voom'):
...     print("-- This parrot wouldn't", action, end=' ')
...     print("if you put", voltage, "volts through it.", end=' ')
...     print("E's", state, "!")
...
>>> d = {"voltage": "four million", "state": "bleedin' demised", "action": "VOOM"}
>>> parrot(**d)
-- This parrot wouldn't VOOM if you put four million volts through it. E's bleedin' demised !
```

## 匿名函数 Lambda

```python
>>> f = lambda a, b: a+b  
>>> f(5, 10) 
15
```

匿名函数可以用于快速定义一次性函数。

```python
>>> word_freq = {'apple': 10, 'banana': 30, 'peach': 20} 
>>> sorted(word_freq.items(), key=lambda x:x[1], reverse=False) 
[('apple', 10), ('peach', 20), ('banana', 30)]
```

匿名函数可以用作列表、字典排序时的key值。

## 编码风格

Python 项目大多都遵循 [**PEP 8**](https://www.python.org/dev/peps/pep-0008) 的风格指南；它推行的编码风格易于阅读、赏心悦目。Python 开发者均应抽时间悉心研读；以下是该提案中的核心要点：

1. **缩进**，用 4 个空格，不要用制表符。
2. **换行**，一行不超过 79 个字符。
3. 用 **空行** 分隔函数和类，及函数内较大的代码块。
4. 最好把 **注释放到单独一行**。
5. 运算符前后、逗号后要用 **空格**，但不要直接在括号内使用： `a = f(1, 2) + g(3, 4)`。
6. 类和函数的命名要一致；按惯例，**命名类** 用 `UpperCamelCase`，**命名函数与方法** 用 `lowercase_with_underscores`。命名方法中第一个参数总是用 `self` (类和方法详见 [初探类](https://docs.python.org/zh-cn/3/tutorial/classes.html#tut-firstclasses))。
7. 编写用于国际多语环境的代码时，**不要用生僻的编码**。Python 默认的 UTF-8 或纯 ASCII 可以胜任各种情况。同理，就算多语阅读、维护代码的可能再小，也不要在标识符中使用非 ASCII 字符。
