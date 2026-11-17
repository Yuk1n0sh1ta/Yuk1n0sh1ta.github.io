---
title: 惊奇发现Latex嵌入文本的新用法哈哈哈
date: '2020-07-14 23:35:14'
category: 生活
tags:
  - Latex
draft: false
---

# 惊奇发现Latex嵌入文本的新用法哈哈哈
## 完整公式的嵌入
在进行 [文献阅读 TINYBERT DISTILLING BERT FOR NATURAL LANGUAGE UNDERSTANDING](/posts/2020-07-13-文献阅读-tinybert-distilling-bert-for-natural-language-understanding/) 这篇文章的校对时，我发现公式是可以嵌入Markdown语法的。

Markdown的Raw文本：
```
1. 欧拉公式：
\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}
```
实际效果：
1. 欧拉公式：

$$
\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}
$$


但之前我没发现，因为我怕不换行不触发Latex语法。

以前Markdown的Raw文本：
```
1. 欧拉公式：

\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}
```

实际效果：
1. 欧拉公式：


$$
\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}
$$


## 不换行的公式嵌入
经过了上个实验之后我发现Latex是可以和Markdown同生共死的，那么能不能把公式植入文本中呢？毕竟直接写矩阵H^S实在是太丑了。

于是有了如下结果。

Markdown的Raw文本：
```
1. 欧拉 $ e^{i\pi} + 1 = 0 $ 公式：
\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}
```

实际效果：
1. 欧拉 $ e^{i\pi} + 1 = 0 $ 公式：

$$
\begin{equation}
e^{i\pi} + 1 = 0
\end{equation}
$$


这样我就可以愉快地在文本中加一些优美的符号了，非常快乐！

## 关于转义
由于转义符号\在Latex当中有作用，所以当我们想在Latex中转义时要双写。

Markdown的Raw文本：
```
1. raw_input：
\begin{equation}
raw\\_input
\end{equation}
```

实际效果：
1. raw_input：

$$
\begin{equation}
raw\\_input
\end{equation}
$$


如果单写的话不行。

单写反斜杠Markdown的Raw文本：
```
1. raw_input：
\begin{equation}
raw\_input
\end{equation}
```

实际效果：
1. raw_input：

$$
\begin{equation}
raw\_input
\end{equation}
$$


## 后记
虽然看上去是关于Markdown和Latex语法，但是算是生活小实验吧，就归到生活了。~~其实是因为生活分类一直没水文章有点强迫症。~~