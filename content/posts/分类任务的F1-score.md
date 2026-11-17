---
title: 分类任务的F1-score
date: '2022-04-03 23:35:14'
category: 学习
tags:
  - python
  - 数据处理
draft: false
---

# 分类任务的F1-score
**背景**：BERT的分类器源码run_classifier.py的评估指标部分只有accuracy和loss，没有F1-score。详情见 [metric_fn](/posts/2020-08-27-run_classifier-py逐行注释/#model-fn-builder) 。

## 二分类模型的准确率、精确率、召回率以及F-score
对于二分类模型：

||预测|1'|0'|Total|
|:-:|:-:|:-:|:-:|:-:|
|实值|||||
|1||TP（真正例）|FN（假反例）|P|
|0||FP（假正例）|TN（真反例）|N|
|Total||P'|N'|S|

1. 准确率（Accuracy）：

$$
\begin{equation}
Accuracy = \frac{TP + TN}{TP + FN + FP + TN} = \frac{TP + TN}{S}
\end{equation}
$$

2. 精确率/查准率（Precision）：

$$
\begin{equation}
Precision = \frac{TP}{TP + FP} = \frac{TP}{P'}
\end{equation}
$$

3. 召回率/查全率（Recall）：

$$
\begin{equation}
Recall = \frac{TP}{TP + FN} = \frac{TP}{P}
\end{equation}
$$

4. F-score：

$$
\begin{equation}
F-score = \frac{(1 + \beta^2) \cdot precision \cdot recall}{\beta^2 \cdot precision + recall}
\end{equation}
$$

F-score的本质是Precision和Recall的加权调和平均。（加权的积在和上飞）
5. F1-score：
当 $ \beta^2 = 1 $ 时：

$$
\begin{equation}
F-score = \frac{2 \cdot precision \cdot recall}{precision + recall}
\end{equation}
$$


## 多分类任务的F1-score
在多分类任务中，由于没有固定的正反例，没有统一的精确率、召回率等定义。
通常有两种算法F1_micro以及F1_macro。

对于N分类模型中的第i类有：

||预测|i'|其他'|Total|
|:-:|:-:|:-:|:-:|:-:|
|实值|||||
|i||TP1（真正例）|FN1（假反例）|P|
|其他||FP1（假正例）|TN1（真反例）|N|
|Total||P'|N'|S|

这样的 **针对第i类的实值-预测值 困惑矩阵** 可通过总的 **N类实值-N类预测值 困惑矩阵** 查表得到，共可得到N个。

根据这N个困惑矩阵的数据给出如下定义：
1. F1_micro：

$$
\begin{equation}
Recall_{micro} = \frac{\sum_{i=1}^{N}TP_i}{\sum_{i=1}^{N}TP_i + \sum_{i=1}^{N}FN_i}\\\
Precision_{micro} = \frac{\sum_{i=1}^{N}TP_i}{\sum_{i=1}^{N}TP_i + \sum_{i=1}^{N}FP_i}\\\
F1_{micro} = \frac{2 \cdot precision \cdot recall}{precision + recall}
\end{equation}
$$


$$
\begin{equation}
\because\sum_{i=1}^{N}TP_i + \sum_{i=1}^{N}FN_i = \sum_{i=1}^{N}TP_i + \sum_{i=1}^{N}FP_i = S\\\
\therefore Accuracy = \frac{\sum_{i=1}^{N}TP_i}{S} = Recall_{micro} = Precision_{micro} = F1_{micro}
\end{equation}
$$

**意义**：F1_micro将**所有样本**都视为具有**同样权重**的样本，并针对全部样本作为整体，计算整体的Recall和Precision，并以此进一步计算F1-score。
**缺点**：对于类别样本不均衡的数据集，如A：B = 10：1。由于F1_micro将所有样本都视为同样权重的样本，A类样本的统计学特征将分配到10倍于B类样本的权重，**造成**不同类别样本的**权重分配不均匀**。
2. F1_macro：

$$
\begin{equation}
Recall_i = \frac{TP_i}{TP_i + FN_i}\\\
Precision_i = \frac{TP_i}{TP_i + FP_i}\\\
F1_i = \frac{2 \cdot precision_i \cdot recall_i}{precision_i + recall_i}\\\
F1_{macro} = \frac{1}{N}\sum_{i=1}^{N}F1_i
\end{equation}
$$

**意义**：F1_macro将**所有类别**都视为具有**同样权重**的类别，并针对每个类别作为整体，分别计算每个类别的Recall和Precision，并以此进一步计算F1-score。
**优点**：对于类别样本不均衡的数据集，如A：B = 10：1。由于F1_macro将所有类别都视为同样权重的类别，A类样本的统计学特征将分配到与B类样本相同的权重，**不会造成**不同类别样本的**权重分配不均匀**。