---
title: Python的内置类型
date: '2021-11-17 11:46:00'
category: 学习
tags:
  - python
series: Python 核心基础
draft: false
---

* 本文参考
\[1] [官方 Python3 教程](https://docs.python.org/zh-cn/3/)
\[2] [RUNOOB Python3 教程](https://www.runoob.com/python3/python3-tutorial.html)

# Python的内置类型
## 逻辑值
1. 被定义为假值的常量: `None` 和 `False`。
2. 任何数值类型的零: `0`, `0.0`, `0j`, `Decimal(0)`, `Fraction(0, 1)`
3. 空的序列和多项集: `''`, `()`, `[]`, `{}`, `set()`, `range(0)`

## 逻辑运算
| 逻辑运算 | 描述 |
| :------: | :--: |
|  x or y  |  或  |
| x and y  |  与  |
|  not x   |  非  |

## 比较运算

| 比较运算 |   描述   |
| :------: | :------: |
|    <     | 严格小于 |
|    <=    | 小于等于 |
|    >     | 严格大于 |
|    >=    | 大于等于 |
|    ==    |   等于   |
|    !=    |  不等于  |

## 成员运算及身份运算
|  运算  |    描述    |
| :----: | :--------: |
|   in   |   包含于   |
| not in |  不包含于  |
|   is   |  相同对象  |
| is not | 不相同对象 |

```python
>>> a = [1, 2, 3]

>>> b = a
>>> b == a
True
>>> b is a
True

>>> b = a[:]
>>> b == a
True
>>> b is a
False
```
1. `b = a` 中，列表的赋值采用的是引用赋值，两者不光数值相同，指针指向也相同。其中之一的列表元素发生改变，另一个也会跟着改变。此时，a 和 b 为相同对象。
2. `b = a[:]` 中，`[:]` 表示只取值，此时列表的赋值只是单纯的复制了数值，两者的数值虽然相同，但指针指向不同。其中之一的列表元素发生改变，另一个不会跟着改变。此时，a 和 b 为不同对象。

## 数字类型及运算符
### 数字类型
1. int
`x = 5`
2. float
`x = 5.0`
3. complex
`x = 5 + 5.0j`

```python
>>> x = []
>>> x.append(5);x.append(5.1);x.append(5+5.1j)
>>> x
[5, 5.1, (5+5.1j)]
```

### 数字运算
|      数字运算       |            描述            |
| :-----------------: | :------------------------: |
|        x + y        |             加             |
|        x - y        |             减             |
|        x * y        |             乘             |
|        x / y        |             除             |
|       x // y        |      整除（向下取整）      |
|        x % y        |            取余            |
|       x ** y        |        x 的 y 次幂         |
|      pow(x, y)      |        x 的 y 次幂         |
|       abs(x)        |          取绝对值          |
|        int()        |      整数强制类型转换      |
|       float()       |     浮点数强制类型转换     |
| complex(real, imag) |            复数            |
|    divmod(x, y)     |      (x // y, x % y)       |
|    round(x[, n])    | 将x保留n位小数（四舍五入） |
|    math.floor(x)    |       <=x的最大整数        |
|    math.ceil(x)     |       >=x的最小整数        |

### 位运算
| 位运算 |   描述   |
| :----: | :------: |
|   x    |    y     |
| x ^ y  | 按位异或 |
| x & y  |  按位与  |
| x << n | 左移n位  |
| x >> n | 右移n位  |
|   ~x   | 按位取反 |

## 序列类型
### 通用序列操作
|     通用序列操作     |                            描述                             |
| :------------------: | :---------------------------------------------------------: |
|        x in s        |      如果 s 中的某项等于 x 则结果为 True，否则为 False      |
|      x not in s      |      如果 s 中的某项等于 x 则结果为 False，否则为 True      |
|        s + t         |                        s 与 t 相拼接                        |
|        s * n         |                相当于 s 与自身进行 n 次拼接                 |
|         s[i]         |                    s 的第 i 项，起始为 0                    |
|        s[i:j]        |                     s 从 i 到 j 的切片                      |
|     s[i:j:step]      |                 s 从 i 到 j 步长为 k 的切片                 |
|        len(s)        |                          s 的长度                           |
|        min(s)        |                         s 的最小项                          |
|        max(s)        |                         s 的最大项                          |
| s.index(x[, i[, j]]) | x 在 s 中首次出现项的索引号（索引号在 i 或其后且在 j 之前） |
|      s.count(x)      |                    x 在 s 中出现的总次数                    |

### 可变序列操作

|  可变序列操作  |                          描述                          |
| :------------: | :----------------------------------------------------: |
|    s[i] = x    |                 将 s 的第 i 项替换为 x                 |
|   s[i:j] = t   |     将 s 从 i 到 j 的切片替换为可迭代对象 t 的内容     |
|   del s[i:j]   |                   等同于 s[i:j] = []                   |
|  s.append(x)   | 将 x 添加到序列的末尾 (等同于 s[len(s):len(s)] = [x])  |
|   s.clear()    |          从 s 中移除所有项 (等同于 del s[:])           |
|    s.copy()    |             创建 s 的浅拷贝 (等同于 s[:])              |
|  s.extend(t)   | 用 t 的内容扩展 s (基本上等同于 s[len(s):len(s)] = t)  |
| s.insert(i, x) | 在由 i 给出的索引位置将 x 插入 s (等同于 s[i:i] = [x]) |
| s.pop(\*[, i]) |         提取在 i 位置上的项，并将其从 s 中移除         |
|  s.remove(x)   |          删除 s 中第一个 s[i] 等于 x 的项目。          |
|  s.reverse()   |                就地将列表中的元素逆序。                |

### 列表
列表是可变序列，通常用于存放同类项目的集合（其中精确的相似程度将根据应用而变化）。

`class list([iterable])`
可以用多种方式构建列表：
1. 使用一对方括号来表示空列表: `[]`
2. 使用方括号，其中的项以逗号分隔: `[a]` / `[a, b, c]`
3. 使用列表推导式: `[x for _ in iterable]`
4. 使用类型的构造器: `list()` / `list(iterable)`

`list.sort(\*, key=None, reverse=False)`
此方法会对列表进行原地排序，保证稳定。

```python
>>> list = [1, 5, 3, 4, 6, 2]
>>> list.sort()
>>> list
[1, 2, 3, 4, 5, 6]

>>> list = [[1, 5, 3], [4, 6, 2]]
>>> list.sort(key=lambda x:x[2])
>>> list
[[4, 6, 2], [1, 5, 3]]
```

### 元组
元组是不可变序列，通常用于储存异构数据的多项集（例如由 `enumerate()` 内置函数所产生的二元组）。 元组也被用于需要同构数据的不可变序列的情况（例如允许存储到 set 或 dict 的实例）。

`class tuple([iterable])`
可以用多种方式构建元组：
1. 使用一对圆括号来表示空元组: `()`
2. 使用一个后缀的逗号来表示单元组: `a,` / `(a,)`
3. 使用以逗号分隔的多个项: `a, b, c` / `(a, b, c)`
4. 使用内置的tuple(): `tuple()` / `tuple(iterable)`

### range 对象
range 类型表示不可变的数字序列，通常用于在 for 循环中循环指定的次数。

`class range(stop)`
`class range(start, stop[, step])`
range 构造器的参数必须为整数。 
1. 如果省略 step 参数，其默认值为 1。 
2. 如果省略 start 参数，其默认值为 0。
3. 如果 step 为零则会引发 ValueError。

```python
>>> list(range(10))
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
>>> list(range(1, 11))
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
>>> list(range(0, 30, 5))
[0, 5, 10, 15, 20, 25]
>>> list(range(0, 10, 3))
[0, 3, 6, 9]
>>> list(range(0, -10, -1))
[0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
>>> list(range(0))
[]
>>> list(range(1, 0))
[]
```

### 文本序列类型
在 Python 中处理文本数据是使用 str 对象，也称为 字符串。
字符串是由 Unicode 码位构成的不可变序列。

`class str(object='')`
`class str(object=b'', encoding='utf-8', errors='strict')`
可以用多种方式构建：
1. 使用引号：`''` /`""` /`''' '''` / `""" """`
2. 使用内置的str()：`str()` / `str(object)`
3. 使用raw禁止转义：`r'\n'`

|                    str的方法                    |                             描述                             |
| :---------------------------------------------: | :----------------------------------------------------------: |
|                str.capitalize()                 |                       将str首字母大写                        |
|                   str.find(s)                   |       检测字符串s是否在str中，真返回True，假返回False        |
|                    str.is?()                    |           检查str是否为?，真返回True，假返回False            |
|                   str.join(s)                   |         以str为分割，将s中的元素合并为一个新的字符串         |
|            str.lower() / str.upper()            |                  将str全部字符转为小写/大写                  |
|  str.lstrip(s) / str.rstrip(s) / str.strip(s)   |              将str 左侧/右侧/两侧 的字符串s去掉              |
|          str.replace(old, new[, max])           |          将str中的字符串old替换为new，最大次数为max          |
|           str.split(sep, maxsplit=-1)           | 将str以sep中的元素为基准进行分割，最多分割maxsplit次，得到maxsplit段 |
| str.startwith(startstr, beg=0, end=len(string)) |        检查str是否在(beg, end)区间以startstr作为开头         |
|                 str.swapcase()                  |           将str的 大/小 写字母转换为 小/大 写字母            |
|                   str.title()                   |                  将str中所有单词首字母大写                   |

`str.is?()`：

| str.is?() 中的 ? |                   描述                   |
| :--------------: | :--------------------------------------: |
|      alnum       |           是否只包含字母或数字           |
|      alpha       |              是否只包含字母              |
|      digit       |              是否只包含数字              |
|      lower       | 是否只包含小写字母（只考虑区分大小写的） |
|     numeric      |            是否只包含数字字符            |
|      space       |              是否只包含空格              |
|      upper       | 是否只包含大写字母（只考虑区分大小写的） |

### 字符串格式化
[str.format()](https://docs.python.org/zh-cn/3/library/string.html#formatstrings)

## 二进制序列类型（待补充）

## 集合类型 - set, frozen
set 对象是由具有唯一性的 hashable 对象所组成的无序多项集。常见的用途包括成员检测、从序列中去除重复项以及数学中的集合类计算，例如交集、并集、差集与对称差集等等。
目前有两种内置集合类型：set 和 frozenset。
1. set 类型是可变的。其内容可以使用 `add()` 和 `remove()` 这样的方法来改变。由于是可变类型，它没有哈希值，且不能被用作字典的键或其他集合的元素。
2. frozenset 类型是不可变并且为 hashable 。其内容在被创建后不能再改变；因此它可以被用作字典的键或其他集合的元素。

`class set([iterable])`
`class frozenset([iterable])`
返回一个新的 set 或 frozenset 对象，其元素来自于 iterable。集合的元素必须为 hashable 要表示由集合对象构成的集合，所有的内层集合必须为 frozenset 对象。如果未指定 iterable，则将返回一个新的空集合。
集合可用多种方式来创建：
1. 使用花括号内以逗号分隔元素的方式: 
`{'jack', 'sjoerd'}`
2. 使用集合推导式: 
`{c for c in 'abracadabra' if c not in 'abc'}`
3. 使用类型构造器: 
`set()` / `set('foobar')` / `set(['a', 'b', 'foo'])`

|              set的操作              |                     描述                      |
| :---------------------------------: | :-------------------------------------------: |
|              len(set)               |              返回set中的元素数量              |
| element in set / element not in set |          判断element是否出现在set中           |
|          set.add(element)           |               将element加入set                |
|             set.clear()             |                    清空set                    |
|             set.copy()              |                返回set的浅拷贝                |
|        setx.difference(sety)        |      返回包含在setx但不包含在sety的元素       |
|        set.discard(element)         | 移除set中的指定element（element不存在不报错） |
|        set.intersection(set)        |              返回两个集合的交集               |
|          set.isjoint(set)           |            判断两个集合是否有交集             |
|         setx.issubset(sety)         |           判断setx是否为sety的子集            |
|        setx.issuperset(sety)        |           判断setx是否为sety的父集            |
|              set.pop()              |        随机移除set中的元素，返回该元素        |
|         set.remove(element)         |  移除set中的指定element（element不存在报错）  |
|   setx.symmetric_difference(sety)   |         返回setx和sety中不重复的元素          |
|           set.union(set)            |              返回两个集合的并集               |
|          setx.update(sety)          |           将setx置为两个集合的并集            |

## 映射类型
mapping 对象会将 hashable 值映射到任意对象。 映射属于可变对象。目前仅有一种标准映射类型 字典。
字典的键几乎可以是任何值。非 hashable 的值，即包含列表、字典或其他可变类型的值（此类对象基于值而非对象标识进行比较）不可用作键。数字类型用作键时遵循数字比较的一般规则：如果两个数值相等 (例如 1 和 1.0) 则两者可以被用来索引同一字典条目。

`class dict(\*\*kwarg)`
`class dict(mapping, \*\*kwarg)`
`class dict(iterable, \*\*kwarg)`
返回一个新的字典，基于可选的位置参数和可能为空的关键字参数集来初始化。
字典可用多种方式来创建：

1. 使用花括号内以逗号分隔 键: 值 对的方式: `{'jack': 4098, 'sjoerd': 4127}` or `{4098: 'jack', 4127: 'sjoerd'}`
2. 使用字典推导式: `{}`, `{x: x ** 2 for x in range(10)}`
3. 使用类型构造器: `dict()` / `dict([('foo', 100), ('bar', 200)])` / `dict(foo=100, bar=200)`

|            dict的操作            |                             描述                             |
| :------------------------------: | :----------------------------------------------------------: |
|            list(dict)            |                    返回dict所有key的列表                     |
|            len(dict)             |                        返回dict的长度                        |
|            dict[key]             |           返回dict中key的value，若key不存在则报错            |
|        dict[key] = value         |                 将key增加至dict中并赋值value                 |
|          del dict[key]           |              移除dict中的key，若key不存在则报错              |
|  key in dict / key not in dict   |                     判断key是否在dict中                      |
|           dict.clear()           |                           清空dict                           |
|           dict.copy()            |                       返回dict的浅拷贝                       |
| dict.fromkeys(iterable[, value]) |                通过iterable类型的元素建立列表                |
|     dict.get(key[, default])     | 如果key存在则返回key对应的value，如果key不存在则返回default的值，default默认为None |
|           dict.items()           |      以((key, value), ( , ), ...)的形式返回dict的键值对      |
|           dict.keys()            |  以视图对象dict_keys([key1, key2, ...])的形式返回dict的keys  |
|          dict.pop(key)           |    返回dict中key的value，并将该key移除（key不存在则报错）    |
|          dict.popitem()          | 以LIFO（Last In First Out）顺序返回dict中key的value，并将其移除 |
|          dict.values()           | 以视图对象dict_values([value1, value2, ...])的形式返回dict的values |

### 字典视图对象
由 `dict.keys()`, `dict.values()` 和 `dict.items()` 所返回的对象是 视图对象。该对象提供字典条目的一个动态视图，这意味着当字典改变时，视图也会相应改变。
可以使用 `list(dict.keys())` 将字典视图对象转换为list。

## 上下文管理器类型（待补充）
Python 的 with 语句支持通过上下文管理器所定义的运行时上下文这一概念。此对象的实现使用了一对专门方法，允许用户自定义类来定义运行时上下文，在语句体被执行前进入该上下文，并在语句执行完毕时退出该上下文。
详情请参考 [with 语句]( \ )。

## union类型（待补充）