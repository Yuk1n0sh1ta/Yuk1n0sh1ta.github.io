---
title: NLP with GTX1060（文本分类）
date: '2021-04-16 21:12:00'
category: 学习
tags:
  - NLP
draft: false
---

# NLP with GTX1060（文本分类）
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

# 2 文本分类 with GTX1060
## 2.1 介绍
### 2.1.1 任务介绍
文本分类概要：
1. 已知条件：每段文本都有且只有一个标签与之对应，标签集合已知。
2. 先验知识：一个标注好标签的文本集合。
3. 目标：对给定一段任意文本进行正确的分类。

文本分类的实际应用：
1. 文章分类
2. 文本情感分析（消极/积极）

### 2.1.2 模型介绍
使用模型：[DistilBERT](https://arxiv.org/abs/1910.01108)
特点：[DistilBERT is a small, fast, cheap and light Transformer model trained by distilling BERT base. It has 40% less parameters than bert-base-uncased, runs 60% faster while preserving over 95% of BERT’s performances as measured on the GLUE language understanding benchmark. ](https://huggingface.co/transformers/model_doc/distilbert.html)
一句话概括：又快又好

## 2.2 代码
### 2.2.1 DistilBERT模型训练
```python
# 库
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from transformers import Trainer, TrainingArguments
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
# 定义 读取tsv文件函数
# tsv文件 - [text1, text2, ... , text], [label1, label2, ... , label]
# 其中返回的label会转换为Lookup Table中的序号
def read_tsv_file(file_dir):
    # Create Lookup Table
    str2label = ["cs.AI", "cs.CE", "cs.cv", "cs.DS", "cs.IT", "cs.NE", "cs.PL", "cs.SY", "math.AC", "math.GR", "math.ST"]
    texts = []
    labels = []
    with open(file_dir, 'r', encoding='utf-8', newline='') as tsv_file:
        for line in tsv_file.readlines():
            if line == '' or line == '\n':
                continue
            line_list = line.split('\t')
            texts.append(line_list[-1])                         # 文本在tsv中的最后一栏   
            labels.append(str2label.index(line_list[-2]))       # 标签在tsv中的倒数第二栏
        tsv_file.close()
    return texts, labels
# 定义 bert训练函数
def bert_classification_training(train_file_name, eval_file_name, epochs):
    # 设备选择
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # 文件输入
    train_texts, train_labels = read_tsv_file(train_file_name + '.tsv')
    train_num = len(train_labels)
    eval_texts, eval_labels = read_tsv_file(eval_file_name + '.tsv')
    eval_num = len(eval_labels)
    # 模型、tokenizer选择
    tokenizer = DistilBertTokenizerFast.from_pretrained('./distilbert-base-uncased')  # DistilBertTokenizer和BertTokenizerFast一样。Fast版本比非Fast版本多了CPU多线程支持，所以快。
    model = DistilBertForSequenceClassification.from_pretrained('./distilbert-base-uncased')
    # Tokenization
    ###  注1
    train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=512, return_tensors="pt")
    eval_encodings = tokenizer(eval_texts, truncation=True, padding=True, max_length=512, return_tensors="pt")
    # 定义 MyDataset类
    class MyDataset(torch.utils.data.Dataset):
        def __init__(self, encodings, labels):
            self.encodings = encodings
            self.labels = labels
        ### 注2
        def __getitem__(self, idx):
            item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
            item['labels'] = torch.tensor(self.labels[idx])
            return item
        def __len__(self):
            return len(self.labels)
    # 创建数据集
    train_dataset = MyDataset(train_encodings, train_labels)
    eval_dataset = MyDataset(eval_encodings, eval_labels)
    # MyTrainer参数设定
    ### 注3
    training_args = TrainingArguments(
        output_dir='./results',                 # 输出目录
        num_train_epochs=epochs,                # 训练轮数
        per_device_train_batch_size=8,          # 训练batch
        per_device_eval_batch_size=8,           # 评估batch
        learning_rate=5e-5,                     # AdamW学习率
        warmup_ratio=0.01,                      # 热身比率
        weight_decay=0.01,                      # 衰减率
        logging_steps=10,                       # log频率
        metric_for_best_model='eval_accuracy',  # 决定最好模型的metric
        eval_steps=500,                         # 评估频率
        load_best_model_at_end=True,            # 是否在训练结束后加载最好的模型
    )
    # 定义 计算评估指标函数
    def compute_metrics(pred):
        labels = pred.label_ids
        preds = pred.predictions.argmax(-1)
        precision, recall, f1, _ = precision_recall_fscore_support(labels, preds, average='macro')
        acc = accuracy_score(labels, preds)
        return {
            'accuracy': acc,
            'f1': f1,
            'precision': precision,
            'recall': recall
        }
    # 初始化MyTrainer
    MyTrainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        compute_metrics=compute_metrics
    )
    # 开始训练
    MyTrainer.train()
    # 保存最后的模型
    bert_model_save_dir = './bert_model.pkl'
    torch.save(model, bert_model_save_dir)
    # 开始评估
    output_dict = MyTrainer.evaluate()
    # 提取评估结果
    eval_loss = output_dict['traineval_loss']
    eval_accuracy = output_dict['eval_accuracy']
    eval_macrof1 = output_dict['eval_f1']
    eval_precision = output_dict['eval_precision']
    eval_recall = output_dict['eval_recall']
    # 将评估结果写入tsv文件
    with open('distilbert_train' + str(train_num) + '_eval' + str(eval_num) + '_result.csv', 'a', encoding='utf-8') as result:
        result.write('eval_loss,' + str(eval_loss) + '\n')
        result.write('eval_accuracy,' + str(eval_accuracy) + '\n')
        result.write('eval_macrof1,' + str(eval_macrof1) + '\n')
        result.write('eval_precision,' + str(eval_precision) + '\n')
        result.write('eval_recall,' + str(eval_recall) + '\n')
        result.close()
# 定义 主函数
def main():
    train_file_name, eval_file_name, epochs = input('Please input your train, evaluation file directory and expected number of training epoch.\nInput format: train eval 8\n').split(' ')
    bert_classification_training(train_file_name, eval_file_name, float(epochs))
```

### 2.2.2 DistilBERT模型预测
```python
# 库
import torch
import torch.nn as nn
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
# 定义 bert预测函数
def bert_classification_prediction(input_text):
    # 设备选择
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    # 选择已经训练好的模型和tokenizer
    tokenizer = DistilBertTokenizerFast.from_pretrained('./distilbert-base-uncased')
    model = torch.load('./bert_model.pkl')
    model = model.to(device)
    # 将输入文本转化为对应label的归一化概率
    input_encoding = tokenizer(input_text, truncation=True, padding=True, max_length=512, return_tensors="pt")  # tokenization
    input_encoding = input_encoding.to(device)
    output = model(**input_encoding)            # 模型输出
    output_logit = output.logits                # 对应label的logits
    softmax = nn.Softmax()               # 选择归一化函数
    output_prob = softmax(output_logit)     # 得到归一化概率
    # 将概率排序后输出
    output_prob_dict = {}
    str2label = ["cs.AI", "cs.CE", "cs.cv", "cs.DS", "cs.IT", "cs.NE", "cs.PL", "cs.SY", "math.AC", "math.GR", "math.ST"]
    # 降序排列
    for i in range(output_logit.shape[-1]):
        output_prob_dict[str2label[i]] = output_prob[0][i]
    out_prob_dict_sorted = sorted(output_prob_dict.items(), key=lambda x:x[1], reverse=True)
    # 打印
    count = 1
    for (key, val) in out_prob_dict_sorted:
        if count > 5:   # 打印概率前5的结果
            break
        else:
            print([key, float(val)])
            count = count + 1
# 定义 主函数
def main():
    input_text = input("Please input your text: ")
    bert_classification_prediction(input_text)
```

## 2.3 实验
### 2.3.1 tsv文件范例
| id | label | text |
| --- | --- | --- |
| 1 | Label 1 | Text 1 |
| 2 | Label 2 | Text 2 |
| 3 | Label 3 | Text 3 |
实际使用详情参见 `read_tsv_file(file_dir):` 函数的文件读取逻辑。

### 2.3.2 训练参数及结果
| Key | Value |
| :-: | :-: |
| Task | Document Classification |
| Dataset | arXiv |
| Category | 11 |
| Train | 2000 |
| Eval | 300 |
| Batch Size | 8(Max) |
| Input Length | 512 Tokens |
| Epoch | 8 |
| Training Time | 20min |
| Accuracy | 76.7% |

## 2.4 注解
### 2.4.1 tokenizer
`train_encodings = tokenizer(train_texts, truncation=True, padding=True, max_length=512, return_tensors="pt")`
1. truncation：多出裁剪
2. padding：不足填充
3. return_tensor="pt"：
'tf': Return TensorFlow tf.constant objects.
'pt': Return PyTorch torch.Tensor objects.
'np': Return Numpy np.ndarray objects.

文档链接：
[tokenizer方法](https://huggingface.co/transformers/main_classes/tokenizer.html#transformers.PreTrainedTokenizerFast)

### 2.4.2 MyDataset
```python
def __getitem__(self, idx):
            item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
            item['labels'] = torch.tensor(self.labels[idx])
            return item
```
1. `item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}` 将被tokenizer编码后的encoding字典中的各项提取出来，包括input_ids、attention_mask。
2. `item['labels'] = torch.tensor(self.labels[idx])` 将labels也加入到item字典中，和input_ids、attention_mask并列。

### 2.4.3 MyTrainer
见附录。

## 附录
### Trainer的Parameters
```python
    '''
    Parameters:
        output_dir (:obj:`str`):
            The output directory where the model predictions and checkpoints will be written.
        overwrite_output_dir (:obj:`bool`, `optional`, defaults to :obj:`False`):
            If :obj:`True`, overwrite the content of the output directory. Use this to continue training if
            :obj:`output_dir` points to a checkpoint directory.
        do_train (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to run training or not. This argument is not directly used by :class:`~transformers.Trainer`, it's
            intended to be used by your training/evaluation scripts instead. See the `example scripts
            <https://github.com/huggingface/transformers/tree/master/examples>`__ for more details.
        do_eval (:obj:`bool`, `optional`):
            Whether to run evaluation on the validation set or not. Will be set to :obj:`True` if
            :obj:`evaluation_strategy` is different from :obj:`"no"`. This argument is not directly used by
            :class:`~transformers.Trainer`, it's intended to be used by your training/evaluation scripts instead. See
            the `example scripts <https://github.com/huggingface/transformers/tree/master/examples>`__ for more
            details.
        do_predict (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to run predictions on the test set or not. This argument is not directly used by
            :class:`~transformers.Trainer`, it's intended to be used by your training/evaluation scripts instead. See
            the `example scripts <https://github.com/huggingface/transformers/tree/master/examples>`__ for more
            details.
        evaluation_strategy (:obj:`str` or :class:`~transformers.trainer_utils.IntervalStrategy`, `optional`, defaults to :obj:`"no"`):
            The evaluation strategy to adopt during training. Possible values are:

                * :obj:`"no"`: No evaluation is done during training.
                * :obj:`"steps"`: Evaluation is done (and logged) every :obj:`eval_steps`.
                * :obj:`"epoch"`: Evaluation is done at the end of each epoch.

        prediction_loss_only (:obj:`bool`, `optional`, defaults to `False`):
            When performing evaluation and generating predictions, only returns the loss.
        per_device_train_batch_size (:obj:`int`, `optional`, defaults to 8):
            The batch size per GPU/TPU core/CPU for training.
        per_device_eval_batch_size (:obj:`int`, `optional`, defaults to 8):
            The batch size per GPU/TPU core/CPU for evaluation.
        gradient_accumulation_steps (:obj:`int`, `optional`, defaults to 1):
            Number of updates steps to accumulate the gradients for, before performing a backward/update pass.

            .. warning::

                When using gradient accumulation, one step is counted as one step with backward pass. Therefore,
                logging, evaluation, save will be conducted every ``gradient_accumulation_steps * xxx_step`` training
                examples.
        eval_accumulation_steps (:obj:`int`, `optional`):
            Number of predictions steps to accumulate the output tensors for, before moving the results to the CPU. If
            left unset, the whole predictions are accumulated on GPU/TPU before being moved to the CPU (faster but
            requires more memory).
        learning_rate (:obj:`float`, `optional`, defaults to 5e-5):
            The initial learning rate for :class:`~transformers.AdamW` optimizer.
        weight_decay (:obj:`float`, `optional`, defaults to 0):
            The weight decay to apply (if not zero) to all layers except all bias and LayerNorm weights in
            :class:`~transformers.AdamW` optimizer.
        adam_beta1 (:obj:`float`, `optional`, defaults to 0.9):
            The beta1 hyperparameter for the :class:`~transformers.AdamW` optimizer.
        adam_beta2 (:obj:`float`, `optional`, defaults to 0.999):
            The beta2 hyperparameter for the :class:`~transformers.AdamW` optimizer.
        adam_epsilon (:obj:`float`, `optional`, defaults to 1e-8):
            The epsilon hyperparameter for the :class:`~transformers.AdamW` optimizer.
        max_grad_norm (:obj:`float`, `optional`, defaults to 1.0):
            Maximum gradient norm (for gradient clipping).
        num_train_epochs(:obj:`float`, `optional`, defaults to 3.0):
            Total number of training epochs to perform (if not an integer, will perform the decimal part percents of
            the last epoch before stopping training).
        max_steps (:obj:`int`, `optional`, defaults to -1):
            If set to a positive number, the total number of training steps to perform. Overrides
            :obj:`num_train_epochs`.
        lr_scheduler_type (:obj:`str` or :class:`~transformers.SchedulerType`, `optional`, defaults to :obj:`"linear"`):
            The scheduler type to use. See the documentation of :class:`~transformers.SchedulerType` for all possible
            values.
        warmup_ratio (:obj:`float`, `optional`, defaults to 0.0):
            Ratio of total training steps used for a linear warmup from 0 to :obj:`learning_rate`.
        warmup_steps (:obj:`int`, `optional`, defaults to 0):
            Number of steps used for a linear warmup from 0 to :obj:`learning_rate`. Overrides any effect of
            :obj:`warmup_ratio`.
        logging_dir (:obj:`str`, `optional`):
            `TensorBoard <https://www.tensorflow.org/tensorboard>`__ log directory. Will default to
            `runs/**CURRENT_DATETIME_HOSTNAME**`.
        logging_strategy (:obj:`str` or :class:`~transformers.trainer_utils.IntervalStrategy`, `optional`, defaults to :obj:`"steps"`):
            The logging strategy to adopt during training. Possible values are:

                * :obj:`"no"`: No logging is done during training.
                * :obj:`"epoch"`: Logging is done at the end of each epoch.
                * :obj:`"steps"`: Logging is done every :obj:`logging_steps`.

        logging_first_step (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to log and evaluate the first :obj:`global_step` or not.
        logging_steps (:obj:`int`, `optional`, defaults to 500):
            Number of update steps between two logs if :obj:`logging_strategy="steps"`.
        save_strategy (:obj:`str` or :class:`~transformers.trainer_utils.IntervalStrategy`, `optional`, defaults to :obj:`"steps"`):
            The checkpoint save strategy to adopt during training. Possible values are:

                * :obj:`"no"`: No save is done during training.
                * :obj:`"epoch"`: Save is done at the end of each epoch.
                * :obj:`"steps"`: Save is done every :obj:`save_steps`.

        save_steps (:obj:`int`, `optional`, defaults to 500):
            Number of updates steps before two checkpoint saves if :obj:`save_strategy="steps"`.
        save_total_limit (:obj:`int`, `optional`):
            If a value is passed, will limit the total amount of checkpoints. Deletes the older checkpoints in
            :obj:`output_dir`.
        no_cuda (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to not use CUDA even when it is available or not.
        seed (:obj:`int`, `optional`, defaults to 42):
            Random seed that will be set at the beginning of training. To ensure reproducibility across runs, use the
            :func:`~transformers.Trainer.model_init` function to instantiate the model if it has some randomly
            initialized parameters.
        fp16 (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to use 16-bit (mixed) precision training instead of 32-bit training.
        fp16_opt_level (:obj:`str`, `optional`, defaults to 'O1'):
            For :obj:`fp16` training, Apex AMP optimization level selected in ['O0', 'O1', 'O2', and 'O3']. See details
            on the `Apex documentation <https://nvidia.github.io/apex/amp.html>`__.
        fp16_backend (:obj:`str`, `optional`, defaults to :obj:`"auto"`):
            The backend to use for mixed precision training. Must be one of :obj:`"auto"`, :obj:`"amp"` or
            :obj:`"apex"`. :obj:`"auto"` will use AMP or APEX depending on the PyTorch version detected, while the
            other choices will force the requested backend.
        fp16_full_eval (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to use full 16-bit precision evaluation instead of 32-bit. This will be faster and save memory but
            can harm metric values.
        local_rank (:obj:`int`, `optional`, defaults to -1):
            Rank of the process during distributed training.
        tpu_num_cores (:obj:`int`, `optional`):
            When training on TPU, the number of TPU cores (automatically passed by launcher script).
        debug (:obj:`bool`, `optional`, defaults to :obj:`False`):
            When training on TPU, whether to print debug metrics or not.
        dataloader_drop_last (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether to drop the last incomplete batch (if the length of the dataset is not divisible by the batch size)
            or not.
        eval_steps (:obj:`int`, `optional`):
            Number of update steps between two evaluations if :obj:`evaluation_strategy="steps"`. Will default to the
            same value as :obj:`logging_steps` if not set.
        dataloader_num_workers (:obj:`int`, `optional`, defaults to 0):
            Number of subprocesses to use for data loading (PyTorch only). 0 means that the data will be loaded in the
            main process.
        past_index (:obj:`int`, `optional`, defaults to -1):
            Some models like :doc:`TransformerXL <../model_doc/transformerxl>` or :doc`XLNet <../model_doc/xlnet>` can
            make use of the past hidden states for their predictions. If this argument is set to a positive int, the
            ``Trainer`` will use the corresponding output (usually index 2) as the past state and feed it to the model
            at the next training step under the keyword argument ``mems``.
        run_name (:obj:`str`, `optional`):
            A descriptor for the run. Typically used for `wandb <https://www.wandb.com/>`_ logging.
        disable_tqdm (:obj:`bool`, `optional`):
            Whether or not to disable the tqdm progress bars and table of metrics produced by
            :class:`~transformers.notebook.NotebookTrainingTracker` in Jupyter Notebooks. Will default to :obj:`True`
            if the logging level is set to warn or lower (default), :obj:`False` otherwise.
        remove_unused_columns (:obj:`bool`, `optional`, defaults to :obj:`True`):
            If using :obj:`datasets.Dataset` datasets, whether or not to automatically remove the columns unused by the
            model forward method.

            (Note that this behavior is not implemented for :class:`~transformers.TFTrainer` yet.)
        label_names (:obj:`List[str]`, `optional`):
            The list of keys in your dictionary of inputs that correspond to the labels.

            Will eventually default to :obj:`["labels"]` except if the model used is one of the
            :obj:`XxxForQuestionAnswering` in which case it will default to :obj:`["start_positions",
            "end_positions"]`.
        load_best_model_at_end (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether or not to load the best model found during training at the end of training.

            .. note::

                When set to :obj:`True`, the parameters :obj:`save_strategy` and :obj:`save_steps` will be ignored and
                the model will be saved after each evaluation.
        metric_for_best_model (:obj:`str`, `optional`):
            Use in conjunction with :obj:`load_best_model_at_end` to specify the metric to use to compare two different
            models. Must be the name of a metric returned by the evaluation with or without the prefix :obj:`"eval_"`.
            Will default to :obj:`"loss"` if unspecified and :obj:`load_best_model_at_end=True` (to use the evaluation
            loss).

            If you set this value, :obj:`greater_is_better` will default to :obj:`True`. Don't forget to set it to
            :obj:`False` if your metric is better when lower.
        greater_is_better (:obj:`bool`, `optional`):
            Use in conjunction with :obj:`load_best_model_at_end` and :obj:`metric_for_best_model` to specify if better
            models should have a greater metric or not. Will default to:

            - :obj:`True` if :obj:`metric_for_best_model` is set to a value that isn't :obj:`"loss"` or
              :obj:`"eval_loss"`.
            - :obj:`False` if :obj:`metric_for_best_model` is not set, or set to :obj:`"loss"` or :obj:`"eval_loss"`.
        ignore_skip_data (:obj:`bool`, `optional`, defaults to :obj:`False`):
            When resuming training, whether or not to skip the epochs and batches to get the data loading at the same
            stage as in the previous training. If set to :obj:`True`, the training will begin faster (as that skipping
            step can take a long time) but will not yield the same results as the interrupted training would have.
        sharded_ddp (:obj:`bool`, :obj:`str` or list of :class:`~transformers.trainer_utils.ShardedDDPOption`, `optional`, defaults to :obj:`False`):
            Use Sharded DDP training from `FairScale <https://github.com/facebookresearch/fairscale>`__ (in distributed
            training only). This is an experimental feature.

            A list of options along the following:

            - :obj:`"simple"`: to use first instance of sharded DDP released by fairscale (:obj:`ShardedDDP`) similar
              to ZeRO-2.
            - :obj:`"zero_dp_2"`: to use the second instance of sharded DPP released by fairscale
              (:obj:`FullyShardedDDP`) in Zero-2 mode (with :obj:`reshard_after_forward=False`).
            - :obj:`"zero_dp_3"`: to use the second instance of sharded DPP released by fairscale
              (:obj:`FullyShardedDDP`) in Zero-3 mode (with :obj:`reshard_after_forward=True`).
            - :obj:`"offload"`: to add ZeRO-offload (only compatible with :obj:`"zero_dp_2"` and :obj:`"zero_dp_3"`).

            If a string is passed, it will be split on space. If a bool is passed, it will be converted to an empty
            list for :obj:`False` and :obj:`["simple"]` for :obj:`True`.
        deepspeed (:obj:`str`, `optional`):
            Use `Deepspeed <https://github.com/microsoft/deepspeed>`__. This is an experimental feature and its API may
            evolve in the future. The value is the location of its json config file (usually ``ds_config.json``).
        label_smoothing_factor (:obj:`float`, `optional`, defaults to 0.0):
            The label smoothing factor to use. Zero means no label smoothing, otherwise the underlying onehot-encoded
            labels are changed from 0s and 1s to :obj:`label_smoothing_factor/num_labels` and :obj:`1 -
            label_smoothing_factor + label_smoothing_factor/num_labels` respectively.
        adafactor (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether or not to use the :class:`~transformers.Adafactor` optimizer instead of
            :class:`~transformers.AdamW`.
        group_by_length (:obj:`bool`, `optional`, defaults to :obj:`False`):
            Whether or not to group together samples of roughly the same legnth in the training dataset (to minimize
            padding applied and be more efficient). Only useful if applying dynamic padding.
        report_to (:obj:`str` or :obj:`List[str]`, `optional`, defaults to :obj:`"all"`):
            The list of integrations to report the results and logs to. Supported platforms are :obj:`"azure_ml"`,
            :obj:`"comet_ml"`, :obj:`"mlflow"`, :obj:`"tensorboard"` and :obj:`"wandb"`. Use :obj:`"all"` to report to
            all integrations installed, :obj:`"none"` for no integrations.
        ddp_find_unused_parameters (:obj:`bool`, `optional`):
            When using distributed training, the value of the flag :obj:`find_unused_parameters` passed to
            :obj:`DistributedDataParallel`. Will default to :obj:`False` if gradient checkpointing is used, :obj:`True`
            otherwise.
        dataloader_pin_memory (:obj:`bool`, `optional`, defaults to :obj:`True`)):
            Whether you want to pin memory in data loaders or not. Will default to :obj:`True`.
        skip_memory_metrics (:obj:`bool`, `optional`, defaults to :obj:`False`)):
            Whether to skip adding of memory profiler reports to metrics. Defaults to :obj:`False`.
    '''
```