---
title: 基于llama2生成式大模型的对话系统
date: 2023-07-23 13:33:20
category: 未分类
tags: []
draft: true
---

> 本文旨在以基于llama2生成式大模型的对话系统为例，记录生成式大模型的整个生态。

## 流程图
环境：`vscode` + `python 3.11.4`
算法：数据获取、清洗、处理->模型训练->效果评估->问题分析
工程：数据同步、数据存储&检索、模型加速&部署

## 算法
### 数据获取、清洗、处理
|技术栈|用途|参考资料|
|:-:|:-:|:-:|
|requests库|网络请求|[Requests documentation](https://requests.readthedocs.io/en/latest/)|
|正则表达式|文本快速处理|[Python 正则表达式](https://docs.python.org/zh-cn/3/library/re.html#regular-expression-syntax)|

实例：
1. 通过 requests库 爬取指定知乎 question_id 页面
2. 将 html页面 通过 正则表达式 解析为 json
3. 将 content字段 通过 正则表达式 进行清洗

```python
import requests
import time
import os
import re
import json


def get_zhihu_results(qid_list, 
                      output_dataset_dir="./crawler_result/zhihu_response.tsv", 
                      retry=10, 
                      bad_request_dir="./crawler_result/zhihu_bad_request_qid.tsv"):
    """
    获取知乎指定qid的response。
    Args:
     - qid_list: 
     - output_dataset_dir:
     - retry:
     - bad_request_dir:
    """
    
    if os.path.exists("./crawler_result/") == False:
        os.mkdir("./crawler_result/")
    
    for qid in qid_list:
        url = "https://www.zhihu.com/question/"+qid
        
        for i in range(retry):
            response = requests.post(url)
            time.sleep(0.5)
            if response.status_code == 200:
                break
        
        if response.status_code != 200:
            with open(bad_request_dir, "a", encoding="utf-8") as bad_request_file:
                bad_request_file.write(qid + "\n")
        else:
            with open(output_dataset_dir, "a", encoding="utf-8") as output_dataset_file:
                response_text = response.text.replace("\t", "")
                zhihu_answer_list = get_zhihu_answer_list(response_text)
                for zhihu_answer_dict in zhihu_answer_list:
                    output_list = [
                        zhihu_answer_dict["qid"], 
                        zhihu_answer_dict["content"],
                        zhihu_answer_dict["comment_count"],
                        zhihu_answer_dict["voteup_count"],
                        zhihu_answer_dict["thanks_count"],
                        zhihu_answer_dict["created_time"],
                        zhihu_answer_dict["updated_time"]
                    ]
                    output_list = [str(_) for _ in output_list]
                    output_dataset_file.write("\u0001".join(output_list) + "\n")
        
        time.sleep(0.5)

def get_zhihu_answer_list(zhihu_raw_text):
    """
    通过人工判断answers位置，编写正则提取answers字段的json。
    """
    zhihu_answer_list = []
    pattern = '(?<="answers":)\\{.*"zhiPlusExtraInfo":""\\}\\}'
    zhihu_response_json = re.search(pattern, zhihu_raw_text).group(0)
    zhihu_response_dict = json.loads(zhihu_response_json)
    for zhihu_response in zhihu_response_dict:
        zhihu_answer_dict = {}
        zhihu_answer_dict["qid"] = zhihu_response_dict[zhihu_response]["id"]
        zhihu_answer_dict["content"] = get_clean_text(zhihu_response_dict[zhihu_response]["content"])
        zhihu_answer_dict["comment_count"] = zhihu_response_dict[zhihu_response]["commentCount"]
        zhihu_answer_dict["voteup_count"] = zhihu_response_dict[zhihu_response]["voteupCount"]
        zhihu_answer_dict["thanks_count"] = zhihu_response_dict[zhihu_response]["thanksCount"]
        zhihu_answer_dict["created_time"] = zhihu_response_dict[zhihu_response]["createdTime"]
        zhihu_answer_dict["updated_time"] = zhihu_response_dict[zhihu_response]["updatedTime"]
        zhihu_answer_list.append(zhihu_answer_dict)

    return zhihu_answer_list

def get_clean_text(raw_text):
    """
    去掉html标签及其他符号。
    """
    clean_text = raw_text
    clean_pattern_list = [
        "<.*?>",
        "&.*?;"
    ]
    for clean_pattern in clean_pattern_list:
        clean_text = re.sub(clean_pattern, "", clean_text)
    return clean_text

if __name__ == "__main__":
    qid_list = ["34179857"]
    get_zhihu_results(qid_list)
```

### 模型训练
1. pytorch库（python，深度学习框架）
2. transformers库（python，模型）

### 效果评估
1. sklearn（metric 计算）

### 问题分析
1. postman（接口分析）

## 工程
### 数据同步
1. git（代码同步）
2. dvc（大文件同步）
3. mc（S3数据传输）

### 数据存储&检索
1. 搜索引擎（ES）
2. 图数据库（nebula、cypher）
3. 向量数据库（milvus）
4. Key-Value 数据库（redis）

### 模型加速&部署
1. TensorRT（模型加速）
2. Triton Server（模型 serve）

### 运维平台
1. k8s（微服务部署）
2. graylog（日志系统）
3. grafana（监控系统）

### 语言
python（算法）、Go（服务）、C++（低延时）