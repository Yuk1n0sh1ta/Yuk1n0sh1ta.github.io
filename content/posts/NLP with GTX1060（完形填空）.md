---
title: NLP with GTX1060（完形填空）
date: '2021-04-17 21:12:00'
category: 学习
tags:
  - NLP
draft: false
---

# NLP with GTX1060（完形填空）
# 1 环境准备
我的软件环境：
1. Windows10 
2. python3.7
3. cuda11.0 + pytorch1.8.0 + cudnn（对应版本）

* cuda和cudnn需要和驱动版本搭配，cudnn安装需要注册英伟达账号。

我的硬件环境：
1. Intel I7-8750H
2. Nvidia GTX1060(6G)

python依赖的几个库：
1. pytorch（[官网命令行安装](https://pytorch.org/)）
2. transformers（[官网安装引导](https://huggingface.co/transformers/installation.html)）
3. 可能还要按需安装numpy（已经被pytorch依赖）、sklearn、matplotlib等。（直接pip）

# 2 完型填空 with GTX1060
## 2.1 介绍
### 2.1.1 任务介绍
完型填空概要：
1. 已知条件：在一段文本中，几个单词被替换为了[MASK]符号。
2. 先验知识：一个未被替换任何单词的文本集合。
3. 目标：对给定一段被替换了n个单词的任意文本进行还原，使整段文本语义通顺，符合逻辑。

上下文填空其实是模型在预训练时使用的我认为最主要的获取单词含义、上下文意思的一种方式。
实际上这种任务就是Bert中的Masked Language Model，详情可以参考 [Masked LM](/posts/2020-07-10-如何理解-bert/#1-3-1-Masked-LM) 。
这种任务的本质也是一种分类，只不过在该任务中，类别有vocab_size种，因为字典中的每个token都有填入这里的可能性，我们只是挑选概率高的作为候选。

### 2.1.2 模型介绍
使用模型：[DistilBERT](https://arxiv.org/abs/1910.01108)
特点：详见 [2.1.2 模型介绍](/posts/2021-04-16-nlp-with-gtx1060-文本分类/#2-1-2-模型介绍) 。


## 2.2 代码
### 2.2.1 DistilBERT模型预测
```python
# 库
import torch
import torch.nn as nn
from decimal import Decimal
from transformers import DistilBertTokenizer, DistilBertForMaskedLM
# 定义 mask位置寻找函数
# input_ids列表 - [index1, index2, ... , index]
# 返回的列表包含所有mask在输入文本中的index位置
def find_mask_index(input_tensor):
    output_list = []
    count = 0
    for ids in input_tensor[0]:
        if ids == 103:  # mask的id为103
            output_list.append(count)
        count = count + 1
    return output_list
# 定义 bert完型预测函数
def bert_maskedlm_prediction(input_text):
    # 设备选择
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # 选择已经预训练好的模型和tokenizer
    tokenizer = DistilBertTokenizer.from_pretrained('./distilbert-base-uncased')
    model = DistilBertForMaskedLM.from_pretrained('./distilbert-base-uncased')
    model = model.to(device)
    # 将输出logits转化为对应vocab的归一化概率
    inputs = tokenizer(input_text, return_tensors="pt")
    mask_list = find_mask_index(inputs['input_ids'])
    inputs = inputs.to(device)
    outputs = model(**inputs)
    logits = outputs.logits
    softmax = nn.Softmax()                  # 选择归一化函数
    output_prob_list = []
    for mask_index in range(len(mask_list)):
        output_prob_list.append(softmax(logits[0][mask_list[mask_index]][:]))      # 得到归一化概率
    # 将概率排序后输出
    out_prob_dict_sorted_list = []
    # 降序排列
    for mask_index in range(len(mask_list)):
        output_prob_dict = {}
        for ids in range(output_prob_list[mask_index].shape[-1]):
            output_prob_dict[tokenizer.convert_ids_to_tokens(ids=ids)] = output_prob_list[mask_index][ids]
        out_prob_dict_sorted = sorted(output_prob_dict.items(), key=lambda x:x[1], reverse=True)
        out_prob_dict_sorted_list.append(out_prob_dict_sorted)
    # 打印
    for mask_index in range(len(mask_list)):
        count = 1
        print('######   MASK {}   ######'.format(mask_index))
        for (key, val) in out_prob_dict_sorted_list[mask_index]:
            if count > 5:   # 打印概率前5的结果
                break
            else:
                val = float(val) * 100
                val = Decimal(val).quantize(Decimal('0.00'))
                print('|{:<15s}|{:>5s}%|'.format(key, str(val)))
                count = count + 1
# 定义 主函数
def main():
    input_text = "Beijing is my [MASK], I have lived in [MASK] for many [MASK]. "
    bert_maskedlm_prediction(input_text)
```

### 2.2.2 DistilBERT模型预训练
*  **2.2.1** 中使用的是DistilBERT原作者release的预训练好的模型。若想要重新或者进一步预训练，可能需要极强的GPU资源。
* 预训练代码之后有时间的话会补上。

待续。。。

## 2.3 实验
### 2.3.1 输入文本范例
`Beijing is my [MASK], I have lived in [MASK] for many [MASK].`

其中，[MASK]为被盖住的token，实际中没有绝对的标准答案，通常将原文视为标准答案。

### 2.3.2 预测结果
**######   MASK 0   ######**

|Prediction|Probability|
|:-:|:-:|
|hometown       |49.86%|
|birthplace     |16.05%|
|home           | 5.62%|
|homeland       | 4.64%|
|capital        | 2.64%|

**######   MASK 1   ######**

|Prediction|Probability|
|:-:|:-:|
|beijing        |68.04%|
|china          |11.14%|
|peking         | 2.20%|
|shanghai       | 1.52%|
|tianjin        | 1.49%|

**######   MASK 2   ######**

|Prediction|Probability|
|:-:|:-:|
|years          |74.87%|
|generations    | 9.23%|
|decades        | 7.81%|
|centuries      | 5.62%|
|months         | 0.64%|

* 预测结果：Beijing is my ***hometown / birthplace / home***, I have lived in ***Beijing / China / Peking*** for many ***years / generations / decades***.

### 2.3.3 总结
说实话，模型的三个预测都是我原本想的词。从结果上说，学习了大量语料的BERT还是很擅长完形填空的。不知道在需要先验知识、情感分析、长距离上下文联系的时候，模型还能不能表现出这样的效果。