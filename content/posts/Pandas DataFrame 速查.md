---
title: Pandas DataFrame 速查
date: '2023-01-15 18:45:00'
category: 学习
tags:
  - python
  - pandas
draft: false
---

# Pandas DataFrame 速查

## 1 DataFrame 初始化

### 1.1 从列表初始化

```python
data = [['apple', 'fruit', 5], ['bike', 'vehicle', 10], ['computer', 'device', 2]]
dataset = pd.DataFrame(data, columns=['name', 'category', 'number'], dtype=float)
>>> dataset
       name category  number
0     apple    fruit     5.0
1      bike  vehicle    10.0
2  computer   device     2.0
```

### 1.2 从字典初始化

```python
>>> data = {
    'name': ['apple', 'bike', 'computer'], 
    'category': ['fruit', 'vehicle', 'device'], 
    'number': [5, 10, 2]
}
>>> dataset = pd.DataFrame(data)
>>> dataset
       name category  number
0     apple    fruit       5
1      bike  vehicle      10
2  computer   device       2
```

### 1.3 从文件读取

`pandas.read_csv(file_dir, sep: str, usecols: list, na_values: str)`

`pandas.read_excel(file_dir, sheet_name: int / str / list, usecols: list, na_values: str)`

## 2 DataFrame 操作

### 2.1 遍历操作

```python
import pandas as pd
data = {
    'name': ['apple', 'bike', 'computer'], 
    'category': ['fruit', 'vehicle', 'device'], 
    'number': [5, 10, 2]
}
dataset = pd.DataFrame(data)

>>> dataset
       name category  number
0     apple    fruit       5
1      bike  vehicle      10
2  computer   device       2

for i in range(len(dataset)):
    for j in range(len(dataset.columns)):
        dataset[dataset.columns[j]][i] = i * len(dataset.columns) + j
print(dataset)

>>> dataset
  name category  number
0    0        1       2
1    3        4       5
2    6        7       8
```

### 2.2 获取指定数据

#### 2.2.1 获取指定元素

获取 "device" 。

```python
>>> dataset
       name category  number
0     apple    fruit       5
1      bike  vehicle      10
2  computer   device       2

>>> dataset['category'][2]
'device'

# .loc[ , ]
>>> dataset.loc[2, 'category']
'device'

# .iloc[ , ]
>>> dataset.iloc[2, 1]
'device'
```

#### 2.2.2 获取指定行

获取第2行。

```python
# .loc[ , ]
>>> line_2 = dataset.loc[2, :]
>>> line_2
name        computer
category      device
number             2
Name: 2, dtype: object

>>> for item in line_2:
...     print(item)
...
computer
device
2

# .iloc[ , ]
>>> line_2 = dataset.iloc[2, :]
>>> line_2
name        computer
category      device
number             2
Name: 2, dtype: object

>>> for item in line_2:
...     print(item)
...
computer
device
2
```

#### 2.2.3 获取指定列

获取 "category" 列。

```python
# .loc[ , ]
>>> row_category = dataset.loc[:, 'category']
>>> row_category
0      fruit
1    vehicle
2     device
Name: category, dtype: object

>>> for item in row_category:
...     print(item)
...
fruit
vehicle
device

# .iloc[ , ]
>>> row_category = dataset.iloc[:, 1]
>>> row_category
0      fruit
1    vehicle
2     device
Name: category, dtype: object

>>> for item in row_category:
...     print(item)
...
fruit
vehicle
device
```

### 2.3 空值判断

```python
df = pd.DataFrame(dict(age=[5, 6, np.NaN],
...               born=[pd.NaT, pd.Timestamp('1939-05-27'),
...               pd.Timestamp('1940-04-25')],
...               name=['Alfred', 'Batman', ''],
...               toy=[None, 'Batmobile', 'Joker']))
>>> df
   age       born    name        toy
0  5.0        NaT  Alfred       None
1  6.0 1939-05-27  Batman  Batmobile
2  NaN 1940-04-25              Joker

>>> df.isna()
     age   born   name    toy
0  False   True  False   True
1  False  False  False  False
2   True  False  False  False

>>> pd.isna(df)
     age   born   name    toy
0  False   True  False   True
1  False  False  False  False
2   True  False  False  False
```

### 2.4 转array处理

```python
>>> df = pd.DataFrame({'age':     [ 3,  29],
...                    'height':  [94, 170],
...                    'weight':  [31, 115]})
>>> df
   age  height  weight
0    3      94      31
1   29     170     115
>>> df.values
array([[  3,  94,  31],
       [ 29, 170, 115]], dtype=int64)
```

### 2.5 去重

```python
>>> df = pd.DataFrame({
...     'brand': ['Yum Yum', 'Yum Yum', 'Indomie', 'Indomie', 'Indomie'],
...     'style': ['cup', 'cup', 'cup', 'pack', 'pack'],
...     'rating': [4, 4, 3.5, 15, 5]
... })

>>> df
    brand style  rating
0  Yum Yum   cup     4.0
1  Yum Yum   cup     4.0
2  Indomie   cup     3.5
3  Indomie  pack    15.0
4  Indomie  pack     5.0

>>> df.drop_duplicates()
    brand style  rating
0  Yum Yum   cup     4.0
2  Indomie   cup     3.5
3  Indomie  pack    15.0
4  Indomie  pack     5.0

>>> df.drop_duplicates(subset=['brand', 'style'], keep='last')
    brand style  rating
1  Yum Yum   cup     4.0
2  Indomie   cup     3.5
4  Indomie  pack     5.0
```

## 3 DataFrame 导出
### 3.1 导出为Excel
### 3.2 导出为tsv