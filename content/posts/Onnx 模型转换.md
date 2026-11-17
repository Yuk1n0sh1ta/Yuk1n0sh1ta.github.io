---
title: Onnx 模型转换
date: '2023-01-15 20:05:00'
category: 学习
tags:
  - python
  - onnx
draft: false
---

# Onnx 模型转换代码示例

## BERT类模型转换

```Python
from transformers import BertTokenizerFast
import torch.nn as nn
import onnxruntime as ort
import numpy as np

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

class BertForClassification(nn.Module):
    def __init__(self, bert, label_num):
        super(BertForClassification, self).__init__()
        self.bert = bert
        self.decoder = nn.Linear(768, label_num)

    def forward(self, input_ids, attention_mask=None, token_type_ids=None):
        outputs = self.bert(input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids).pooler_output
        logits = self.decoder(outputs)
        return logits

def pt2onnx(pt_dir, onnx_dir, pseudo_input):
    model = torch.load(pt_dir, map_location='cpu')
    torch.onnx.export(model, 
                      pseudo_input, 
                      onnx_dir, 
                      opset_version=12,
                      do_constant_folding=True,
                      input_names=['input_ids', 'attention_mask', 'token_type_ids'],
                      output_names=['output'],
                      dynamic_axes={
                          'input_ids': {0: 'N', 1: 'L'},
                          'attention_mask': {0: 'N', 1: 'L'},
                          'token_type_ids': {0: 'N', 1: 'L'},
                          'output': {0: 'N'}
                          }
                    )
    print('### pt2onnx finished ###\n')

if __name__ == "__main__":
    # onnx模型转换
    batch_size = 50
    data = torch.zeros(batch_size, 96, device=device).long()
    input_ids = attention_mask = token_type_ids = data
    pseudo_input = (input_ids, attention_mask, token_type_ids)
    pt2onnx('model.bin', 'model.onnx', pseudo_input)
    
    # 检查onnx模型输出精度差距
    input_text_list = ['你好', 'hello', '天气不错！', 'good day!', '怎么老是你？', 'How old are you?']
    tokenizer = BertTokenizerFast.from_pretrained('./bert-base')  # 加载分词器
    sess = ort.InferenceSession('model.onnx', None)  # 加载onnx模型
    model = torch.load('model.bin', map_location=device)  # 加载torch模型
    input_text_encoding = tokenizer(candidate_query_list, padding='max_length', truncation=True, max_length=32, return_tensors='pt')
    input_ids = encoding.data['input_ids'].numpy()
    attention_mask = encoding.data['attention_mask'].numpy()
    token_type_ids = encoding.data['token_type_ids'].numpy()
    
    # onnx、torch分别进行推理
    onnx_output = sess.run(['output'],{'input_ids': input_ids, 'attention_mask': attention_mask, 'token_type_ids': token_type_ids})
    torch_output = model(encoding.data['input_ids'], encoding.data['attention_mask'], encoding.data['token_type_ids'])
    
```

## T5类模型转换

链接：[fastT5](https://github.com/Ki6an/fastT5/tree/8dda859086af631a10ad210a5f1afdec64d49616)
