---
title: opencv添加水印 C++实现
date: '2020-08-07 21:12:00'
category: 学习
tags:
  - opencv
  - C++
draft: false
---

# 1 opencv添加水印 C++实现
## 1.1 动机
动机是想给自己画的画加个水印，虽然p图软件可以轻松做到但是感觉自定义程度并不高，这种复杂度的C++我应该还可以胜任。

## 1.2 直接加权的水印
要输入的水印图片是一张透明的png格式图片。
Yuk1n0.png：

![Yuk1n0](../assets/posts/2020-08-07-opencv添加水印-c-实现/yuk1n0.png)

``` C
#include <opencv2/opencv.hpp>   //opencv头文件
#include <iostream> //C++基本输入输出

//名空间声明
using namespace cv;
using namespace std;

int main() {
    Mat image = imread("E:\\Input.png");
    Mat logo = imread("E:\\Yuk1n0.png");
    Mat imageROI;
    imageROI = image(Rect(1700, 2139, logo.cols, logo.rows));   //Rect(x, y, delta_x, delta_y)表示图像变量image的以(x, y)，(x + delta_x, y)，(x, y + delta_y)，(x + delta_x, y + delta_y)围成的区域
    addWeighted(imageROI, 0.2, logo, 0.8, 0, imageROI);         //对该区域加权赋给imageROI，由于opencv中Mat的本质是指针，故imageROI会直接反映在image的相应位置
    waitKey();
    imwrite("E:\\Example.png", image);
    return 0;
}
```

Example.png：

![Example](../assets/posts/2020-08-07-opencv添加水印-c-实现/example.png)

但是由于图片的透明部分经过imread读进来之后就是黑色，因此我们要想个办法去掉黑色的部分。

## 1.3 经过灰度图mask后的水印

```C
#include <opencv2/opencv.hpp>  //opencv头文件
#include <iostream> //C++基本输入输出

//名空间声明
using namespace cv;
using namespace std;

int main() {
    Mat image = imread("E:\\Input.png");
    Mat logo = imread("E:\\Yuk1n0.png");
    Mat mask = imread("E:\\Yuk1n0.png", 0); //取灰度图
    Mat imageROI;
    Mat imageROI_mask;
    logo = 255 - logo;  //取反色为了不与底色混淆
    image(Rect(1700, 2139, logo.cols, logo.rows)).copyTo(imageROI_mask);
    imageROI = image(Rect(1700, 2139, logo.cols, logo.rows));
    logo.copyTo(imageROI, mask);    //只有mask像素值大于0的位置，才进行copy操作
    addWeighted(imageROI, 0.8, imageROI_mask, 0.2, 0, imageROI);    //此处不直接将logo和imageROI加权的原因是会降低背景不透明度，将贴有水印的背景和未贴有水印的背景加权可以保持背景不透明度为100%
    waitKey();
    imwrite("E:\\Output.png", image);
    return 0;
}
```

Output.png：

![Example](../assets/posts/2020-08-07-opencv添加水印-c-实现/example.png)

![Output](../assets/posts/2020-08-07-opencv添加水印-c-实现/output.png)

## 1.4 附录

阳菜便服Ver.

![Casual](../assets/posts/2020-08-07-opencv添加水印-c-实现/casual.png)

出自 **[bilibili版 天气之子 37:34](https://www.bilibili.com/bangumi/play/ss33343)**

手残不会画，全靠兴趣。

初次尝试base64图片嵌入，试试效果如何。



