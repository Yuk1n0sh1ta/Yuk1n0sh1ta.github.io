---
title: Python的文件IO
date: '2020-10-16 18:04:00'
category: 学习
tags:
  - python
  - 数据处理
series: Python 核心基础
draft: false
---

# Python的文件IO
**背景**：最近要实现一个批量读取txt，并提取信息写入csv的小功能，用作数据预处理。记录一下python的文件I/O，免得下次又得现baidu。

## txt的写
**txt写入：**
```python
with open('test.txt', 'w', encoding = 'utf-8', newline='') as txtfile:
    txtfile.write('Hello World\n')
    txtfile.writelines(['你好', '你好\n', '世界'])
    txtfile.close()
```
**txt输出**：
```
Hello World
你好你好
世界
```

## txt的读
**txt读取**：
```python
with open('test.txt', 'r', encoding = 'utf-8', newline='') as txtfile:
    print(txtfile.readlines())
    txtfile.close()
```
**输出回显：**
```
['Hello World\n', '你好你好\n', '世界']
```

**txt读取：**
```python
with open('test.txt', 'r', encoding = 'utf-8', newline='') as txtfile:
    for line in txtfile.readlines():
        print(line)
    txtfile.close()
```
**输出回显：**
```
Hello World

你好你好

世界
```

## csv的写
**csv写入：**
```python
import csv
with open('test.csv', 'a', encoding = 'utf-8', newline='') as csvfile:
    csvpen = csv.writer(csvfile)
    csvpen.writerow(['id', 'category', 'content'])
    with open('test.txt', 'r', encoding = 'utf-8', newline='') as txtfile:
        for line in txtfile.readlines():
            csvpen.writerow(['id', 'category', line.replace('\n', '')])
        txtfile.close()
    csvfile.close()
```
**csv输出：**
```
id,category,content
id,category,Hello World
id,category,你好你好
id,category,世界
```

## csv的读
**csv读取：**
```python
import csv
with open('test.csv', 'r', encoding = 'utf-8', newline='') as csvfile:
    csvreader = csv.reader(csvfile)
    for row in csvreader:
        print(row[-1])
```
**输出回显：**
```
content
Hello World
你好你好
世界
```

## 附录1 open()函数
`open('文件名', '读写方式', encoding = '文本编码方式', newline='')` 
1. 读写方式主要为：w（write）、r（read）、a（append）。
2. 文本编码方式最好用utf-8，避免乱码，csv最好都用代码编译器打开。
3. newline是用于处理文本行尾的换行转义符的，若果不设置为空，写入csv会出现写一行空一行的bug。

open的具体用法可参考 [Python3 open() 函数](https://www.runoob.com/python3/python3-func-open.html)
newline的具体原理可参考 [python open函数newline用法](https://www.jianshu.com/p/0b0337df165a) 结尾部分

## 附录2 文本处理方法replace以及strip方法
**str.replace(old, new[, max])**
替换str中所有old字符串为new字符串，最多max次。

**str.strip([chars])**
剔除str首尾中包含[chars]中任意字符，直到首尾都出现[chars]中不包含的字符为止。

strip的具体用法可参考 [Python replace()方法](https://www.runoob.com/python/att-string-replace.html)
strip的具体用法可参考 [Python strip()方法](https://www.runoob.com/python/att-string-strip.html)

## 附录3 文件地址的基本用法
|os.path()常用方法|用途|返回示例|
|:-:|:-:|:-:|
|os.path.abspath('.')|返回当前位置的绝对路径|/root/runoob.txt|
|os.path.abspath('..')|返回当前位置的父目录的绝对路径|/root|
|os.path.basename('/root/runoob.txt')|返回当前目录的最后一个元素（不区分文件、文件夹）|runoob.txt|
|os.path.split('/root/runoob.txt')|返回该目录的分割的文件夹与文件名|('/root', 'runoob.txt')|