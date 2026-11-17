---
title: run_classifier.py逐行注释
date: '2020-08-27 23:35:14'
category: 学习
tags:
  - NLP
  - BERT
  - python
draft: false
---

* 本文为BERT的run_classifier.py模块，即分类模块，进行逐行注释。

# run_classifier.py
## 头文件
```python
"""BERT finetuning runner."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import collections
import csv
import os
import modeling
import optimization
import tokenization
import tensorflow as tf
```
## 参数定义
```python
flags = tf.flags
FLAGS = flags.FLAGS
## Required parameters
flags.DEFINE_string(
    "data_dir", None,
    "The input data dir. Should contain the .tsv files (or other data files) "
    "for the task.")
flags.DEFINE_string(
    "bert_config_file", None,
    "The config json file corresponding to the pre-trained BERT model. "
    "This specifies the model architecture.")
flags.DEFINE_string("task_name", None, "The name of the task to train.")
flags.DEFINE_string("vocab_file", None,
                    "The vocabulary file that the BERT model was trained on.")
flags.DEFINE_string(
    "output_dir", None,
    "The output directory where the model checkpoints will be written.")
## Other parameters
flags.DEFINE_string(
    "init_checkpoint", None,
    "Initial checkpoint (usually from a pre-trained BERT model).")
flags.DEFINE_bool(
    "do_lower_case", True,
    "Whether to lower case the input text. Should be True for uncased "
    "models and False for cased models.")
flags.DEFINE_integer(
    "max_seq_length", 128,
    "The maximum total input sequence length after WordPiece tokenization. "
    "Sequences longer than this will be truncated, and sequences shorter "
    "than this will be padded.")
flags.DEFINE_bool("do_train", False, "Whether to run training.")
flags.DEFINE_bool("do_eval", False, "Whether to run eval on the dev set.")
flags.DEFINE_bool(
    "do_predict", False,
    "Whether to run the model in inference mode on the test set.")
flags.DEFINE_integer("train_batch_size", 32, "Total batch size for training.")
flags.DEFINE_integer("eval_batch_size", 8, "Total batch size for eval.")
flags.DEFINE_integer("predict_batch_size", 8, "Total batch size for predict.")
flags.DEFINE_float("learning_rate", 5e-5, "The initial learning rate for Adam.")
flags.DEFINE_float("num_train_epochs", 3.0,
                   "Total number of training epochs to perform.")
flags.DEFINE_float(
    "warmup_proportion", 0.1,
    "Proportion of training to perform linear learning rate warmup for. "
    "E.g., 0.1 = 10% of training.")
flags.DEFINE_integer("save_checkpoints_steps", 1000,
                     "How often to save the model checkpoint.")
flags.DEFINE_integer("iterations_per_loop", 1000,
                     "How many steps to make in each estimator call.")
flags.DEFINE_bool("use_tpu", False, "Whether to use TPU or GPU/CPU.")
tf.flags.DEFINE_string(
    "tpu_name", None,
    "The Cloud TPU to use for training. This should be either the name "
    "used when creating the Cloud TPU, or a grpc://ip.address.of.tpu:8470 "
    "url.")
tf.flags.DEFINE_string(
    "tpu_zone", None,
    "[Optional] GCE zone where the Cloud TPU is located in. If not "
    "specified, we will attempt to automatically detect the GCE project from "
    "metadata.")
tf.flags.DEFINE_string(
    "gcp_project", None,
    "[Optional] Project name for the Cloud TPU-enabled project. If not "
    "specified, we will attempt to automatically detect the GCE project from "
    "metadata.")
tf.flags.DEFINE_string("master", None, "[Optional] TensorFlow master URL.")
flags.DEFINE_integer(
    "num_tpu_cores", 8,
    "Only used if `use_tpu` is True. Total number of TPU cores to use.")
```

tf.flags是tf.app.flags的新版，使用方法见 [https://abhisheksaurabh1985.github.io/2017-12-30-flags-in-python-tf](https://abhisheksaurabh1985.github.io/2017-12-30-flags-in-python-tf) 。flags的引入可以让使用者在cmd中直接操作自定义参数，比如：
`python run_classifier.py --do_train True`
flags的引入还可以在程序全局使用FLAGS.do_train返回该参数的值。

可自定义的参数如下：
1. 输入文件目录（训练，验证，测试用）
2. BERT配置文件位置（json格式）
3. 任务名称（对应不同的测试数据集）
4. 词汇文件位置（txt格式）
5. 输出结果目录（将会包括一些checkpoint）
6. 初始checkpoint（可继承自预训练BERT模型）
7. 单样本序列长度最大值定义（默认128，超出截断，不足补足）
8. 训练轮赋能
9. 验证轮赋能
10. 预测轮赋能
11. 训练轮并行样本数（默认32）
12. 验证轮并行样本数（默认8）
13. 预测轮并行样本数（默认8）
14. 学习率（默认5e-5）
15. 训练轮数（默认3）
16. 热身比例（默认0.1）
17. checkpoints保存频率（默认1000步保存一次）
18. iterations_per_loop指使用TPU时每轮循环的迭代步数
19. 6个TPU相关的配置

## InputExample
```python
class InputExample(object):
  """A single training/test example for simple sequence classification."""
  def __init__(self, guid, text_a, text_b=None, label=None):
    """Constructs a InputExample.
    Args:
      guid: Unique id for the example.
      text_a: string. The untokenized text of the first sequence. For single
        sequence tasks, only this sequence must be specified.
      text_b: (Optional) string. The untokenized text of the second sequence.
        Only must be specified for sequence pair tasks.
      label: (Optional) string. The label of the example. This should be
        specified for train and dev examples, but not for test examples.
    """
    self.guid = guid
    self.text_a = text_a
    self.text_b = text_b
    self.label = label
```
该类用于初始化输入样本。
其中，__init__的四个参数：
1. guid：样本的唯一识别id
2. text_a：sentence-pair的首句
3. text_b：sentence-pair的次句（可以没有）
4. label：该样本的标签/真值。

## PaddingInputExample
```python
class PaddingInputExample(object):
  """Fake example so the num input examples is a multiple of the batch size.
  When running eval/predict on the TPU, we need to pad the number of examples
  to be a multiple of the batch size, because the TPU requires a fixed batch
  size. The alternative is to drop the last batch, which is bad because it means
  the entire output data won't be generated.
  We use this class instead of `None` because treating `None` as padding
  battches could cause silent errors.
  """
```
当样本数不够一个batch时，该类用来充数（padding）。

## InputFeatures
```python
class InputFeatures(object):
  """A single set of features of data."""
  def __init__(self,
               input_ids,
               input_mask,
               segment_ids,
               label_id,
               is_real_example=True):
    self.input_ids = input_ids
    self.input_mask = input_mask
    self.segment_ids = segment_ids
    self.label_id = label_id
    self.is_real_example = is_real_example
```
该类用于初始化输入特征，将输入的raw数据转换成BERT可用的数据。
其中__init__的5个参数：
1. input_ids：输入id，模型会在之后将token通过vocab.txt转化成整数id。
2. input_mask：输入掩码，用一个包含1，0的列表指示/真token/伪token（padding的token）/。
3. segment_ids：段落id，用一个包含0，1的列表指示/首句/次句/。（BERT中的E_a、E_b）
4. label_id：标签id，用[0, n-1]编号n种标签。
5. is_real_example：指示是否为真样本的布尔值（存在充数的样本）。

## DataProcessor
```python
class DataProcessor(object):
  """Base class for data converters for sequence classification data sets."""
  def get_train_examples(self, data_dir):
    """Gets a collection of `InputExample`s for the train set."""
    raise NotImplementedError()
  def get_dev_examples(self, data_dir):
    """Gets a collection of `InputExample`s for the dev set."""
    raise NotImplementedError()
  def get_test_examples(self, data_dir):
    """Gets a collection of `InputExample`s for prediction."""
    raise NotImplementedError()
  def get_labels(self):
    """Gets the list of labels for this data set."""
    raise NotImplementedError()
  @classmethod
  def _read_tsv(cls, input_file, quotechar=None):
    """Reads a tab separated value file."""
    with tf.gfile.Open(input_file, "r") as f:
      reader = csv.reader(f, delimiter="\t", quotechar=quotechar)
      lines = []
      for line in reader:
        lines.append(line)
      return lines
```
该类是之后出现的多个特化数据处理器的父类。
定义的几个方法：
1. get_train_examples：用于特化数据处理器获取训练集样本。
2. get_dev_examples：用于特化数据处理器获取验证集样本。
3. get_test_examples：用于特化数据处理器获取测试集样本。
4. get_labels：用于特化数据处理器获取标签。
5. \_read_tsv：用于特化数据处理器将tsv/csv类型文件转换为列表。

## MrpcProcessor
```python
class MrpcProcessor(DataProcessor):
  """Processor for the MRPC data set (GLUE version)."""
  def get_train_examples(self, data_dir):
    """See base class."""
    return self._create_examples(
        self._read_tsv(os.path.join(data_dir, "train.tsv")), "train")
  def get_dev_examples(self, data_dir):
    """See base class."""
    return self._create_examples(
        self._read_tsv(os.path.join(data_dir, "dev.tsv")), "dev")
  def get_test_examples(self, data_dir):
    """See base class."""
    return self._create_examples(
        self._read_tsv(os.path.join(data_dir, "test.tsv")), "test")
  def get_labels(self):
    """See base class."""
    return ["0", "1"]
  def _create_examples(self, lines, set_type):
    """Creates examples for the training and dev sets."""
    examples = []
    for (i, line) in enumerate(lines):
      if i == 0:
        continue    #跳过第一行，第一行包含表头信息，不包含样本。
      guid = "%s-%s" % (set_type, i)
      text_a = tokenization.convert_to_unicode(line[3])
      text_b = tokenization.convert_to_unicode(line[4])
      if set_type == "test":
        label = "0"
      else:
        label = tokenization.convert_to_unicode(line[0])
      examples.append(
          InputExample(guid=guid, text_a=text_a, text_b=text_b, label=label))
    return examples
```
该类用于文件输入并将数据转化为class InputExample(object)，并写入列表examples。该类是DataProcessor的子类，继承DataProcessor的相关方法。

类似的，还有：
class XnliProcessor(DataProcessor)
class MnliProcessor(DataProcessor)
class ColaProcessor(DataProcessor)

在我们需要处理自己的数据集时，需要自行创建一个自己的数据处理器，并根据数据集的格式对数据进行处理得到InputExample类需要的四个参数guid=guid, text_a=text_a, text_b=text_b, label=label。

## convert_single_example
```python
def convert_single_example(ex_index, example, label_list, max_seq_length,
                           tokenizer):
  """Converts a single `InputExample` into a single `InputFeatures`."""
  
  # 若输入的example为充数的样本，
  # 则将InputFeatures的前4个参数设为相应长度的0的列表，将is_real_example设为假。
  if isinstance(example, PaddingInputExample):
    return InputFeatures(
        input_ids=[0] * max_seq_length,
        input_mask=[0] * max_seq_length,
        segment_ids=[0] * max_seq_length,
        label_id=0,
        is_real_example=False)
  
  # 建立一个{[标签]: 标签序号}的字典
  label_map = {}
  for (i, label) in enumerate(label_list):
    label_map[label] = i
  
  # 将首句和次句Tokenize并截短
  tokens_a = tokenizer.tokenize(example.text_a)
  tokens_b = None
  if example.text_b:
    tokens_b = tokenizer.tokenize(example.text_b)
  if tokens_b:
    # Modifies `tokens_a` and `tokens_b` in place so that the total
    # length is less than the specified length.
    # Account for [CLS], [SEP], [SEP] with "- 3"
    # 超过阈值则首句次句轮流pop一个token
    _truncate_seq_pair(tokens_a, tokens_b, max_seq_length - 3)
  else:
    # Account for [CLS] and [SEP] with "- 2"
    # 超过阈值则直接截短取前端
    if len(tokens_a) > max_seq_length - 2:
      tokens_a = tokens_a[0:(max_seq_length - 2)]
  
  # The convention in BERT is:
  # (a) For sequence pairs:
  #  tokens:   [CLS] is this jack ##son ##ville ? [SEP] no it is not . [SEP]
  #  type_ids: 0     0  0    0    0     0       0 0     1  1  1  1   1 1
  # (b) For single sequences:
  #  tokens:   [CLS] the dog is hairy . [SEP]
  #  type_ids: 0     0   0   0  0     0 0
  #
  # Where "type_ids" are used to indicate whether this is the first
  # sequence or the second sequence. The embedding vectors for `type=0` and
  # `type=1` were learned during pre-training and are added to the wordpiece
  # embedding vector (and position vector). This is not *strictly* necessary
  # since the [SEP] token unambiguously separates the sequences, but it makes
  # it easier for the model to learn the concept of sequences.
  #
  # For classification tasks, the first vector (corresponding to [CLS]) is
  # used as the "sentence vector". Note that this only makes sense because
  # the entire model is fine-tuned.
  tokens = []
  segment_ids = []
  
  # 为token添加[CLS]以及[SEP]
  # 若存在句子对，则将两个句子级联为tokens。
  # 为segment_ids根据句子的前后添加指示，0表示首句，1表示次句。
  tokens.append("[CLS]")
  segment_ids.append(0)
  for token in tokens_a:
    tokens.append(token)
    segment_ids.append(0)
  tokens.append("[SEP]")
  segment_ids.append(0)
  if tokens_b:
    for token in tokens_b:
      tokens.append(token)
      segment_ids.append(1)
    tokens.append("[SEP]")
    segment_ids.append(1)
  
  # 将tokens通过vocab.txt转换为整数input_ids
  input_ids = tokenizer.convert_tokens_to_ids(tokens)
  
  # The mask has 1 for real tokens and 0 for padding tokens. Only real
  # tokens are attended to.
  # 用掩码1表示真token，0表示充数的token。
  input_mask = [1] * len(input_ids)
  # Zero-pad up to the sequence length.
  # 若input_ids长度小于max_seq_length，则用0充数。
  while len(input_ids) < max_seq_length:
    input_ids.append(0)
    input_mask.append(0)
    segment_ids.append(0)
  
  # 断言函数判断是否相等，否则raise错误
  assert len(input_ids) == max_seq_length
  assert len(input_mask) == max_seq_length
  assert len(segment_ids) == max_seq_length
  
  # 从字典label_map中找到example.label的序号id
  label_id = label_map[example.label]
  
  # 打印所有样本中前5个样本的信息
  if ex_index < 5:
    tf.logging.info("*** Example ***")
    tf.logging.info("guid: %s" % (example.guid))
    tf.logging.info("tokens: %s" % " ".join(
        [tokenization.printable_text(x) for x in tokens]))
    tf.logging.info("input_ids: %s" % " ".join([str(x) for x in input_ids]))
    tf.logging.info("input_mask: %s" % " ".join([str(x) for x in input_mask]))
    tf.logging.info("segment_ids: %s" % " ".join([str(x) for x in segment_ids]))
    tf.logging.info("label: %s (id = %d)" % (example.label, label_id))
  
  # 返回包含5个变量的InputFeatures类
  feature = InputFeatures(
      input_ids=input_ids,
      input_mask=input_mask,
      segment_ids=segment_ids,
      label_id=label_id,
      is_real_example=True)
  return feature
```
该类用于将数据处理器返回的多个InputExample类中的单个InputExample转换为InputFeatures类。

## file_based_convert_examples_to_features
```python
def file_based_convert_examples_to_features(
    examples, label_list, max_seq_length, tokenizer, output_file):
  """Convert a set of `InputExample`s to a TFRecord file."""
  
  # TFRecordWriter初始化
  writer = tf.python_io.TFRecordWriter(output_file)
  
  # 循环写入每个样本的features
  for (ex_index, example) in enumerate(examples):
    # 进度条（每10000提示一次）
    if ex_index % 10000 == 0:
      tf.logging.info("Writing example %d of %d" % (ex_index, len(examples)))
    # 将InputExample转换为InputFeatures
    feature = convert_single_example(ex_index, example, label_list,
                                     max_seq_length, tokenizer)
    # 建立整型的特征集，特征集以字典形式存在：
    # int64_list {
    #   value: 0
    #   value: 1
    #   value: ...
    # }
    def create_int_feature(values):
      f = tf.train.Feature(int64_list=tf.train.Int64List(value=list(values)))
      return f
    # 建立一个有序字典
    features = collections.OrderedDict()
    # 建立5个整型特征集
    features["input_ids"] = create_int_feature(feature.input_ids)
    features["input_mask"] = create_int_feature(feature.input_mask)
    features["segment_ids"] = create_int_feature(feature.segment_ids)
    features["label_ids"] = create_int_feature([feature.label_id])
    features["is_real_example"] = create_int_feature(
        [int(feature.is_real_example)])
    # 建立嵌套字典存储features
    # features {
    #   feature {
    #     key: "input_ids"
    #     value {
    #       int64_list {
    #         value: 0
    #         value: 1
    #       }
    #     }
    #   }
    #   feature {
    #     key: "input_mask"
    #     value {
    #       int64_list {
    #         value: 0
    #         value: 0
    #       }
    #     }
    #   }
    # }
    tf_example = tf.train.Example(features=tf.train.Features(feature=features))
    #序列化之后（转换为二进制流）写入TFRecord
    writer.write(tf_example.SerializeToString())
  writer.close()
```
该函数用于将每个样本的特征写入TFRecord留底。
关于TFRecord，我找到了一篇比较简洁明了的博文 [https://www.cnblogs.com/yanshw/p/12419616.html](https://www.cnblogs.com/yanshw/p/12419616.html) 。

## file_based_input_fn_builder
```python
def file_based_input_fn_builder(input_file, seq_length, is_training,
                                drop_remainder):
  """Creates an `input_fn` closure to be passed to TPUEstimator."""
  name_to_features = {
      "input_ids": tf.FixedLenFeature([seq_length], tf.int64),
      "input_mask": tf.FixedLenFeature([seq_length], tf.int64),
      "segment_ids": tf.FixedLenFeature([seq_length], tf.int64),
      "label_ids": tf.FixedLenFeature([], tf.int64),
      "is_real_example": tf.FixedLenFeature([], tf.int64),
  }
  def _decode_record(record, name_to_features):
    """Decodes a record to a TensorFlow example."""
    example = tf.parse_single_example(record, name_to_features)
    # tf.Example only supports tf.int64, but the TPU only supports tf.int32.
    # So cast all int64 to int32.
    for name in list(example.keys()):
      t = example[name]
      if t.dtype == tf.int64:
        t = tf.to_int32(t)
      example[name] = t
    return example
  def input_fn(params):
    """The actual input function."""
    batch_size = params["batch_size"]
    # For training, we want a lot of parallel reading and shuffling.
    # For eval, we want no shuffling and parallel reading doesn't matter.
    d = tf.data.TFRecordDataset(input_file)
    if is_training:
      d = d.repeat()
      d = d.shuffle(buffer_size=100)
    d = d.apply(
        tf.contrib.data.map_and_batch(
            lambda record: _decode_record(record, name_to_features),
            batch_size=batch_size,
            drop_remainder=drop_remainder))
    return d
  return input_fn
```
\* 该函数用于基于文件将输入函数传入TPU，有关TPU的部分先搁置。

## _truncate_seq_pair
```python
def _truncate_seq_pair(tokens_a, tokens_b, max_length):
  """Truncates a sequence pair in place to the maximum length."""
  # This is a simple heuristic which will always truncate the longer sequence
  # one token at a time. This makes more sense than truncating an equal percent
  # of tokens from each, since if one sequence is very short then each token
  # that's truncated likely contains more information than a longer sequence.
  while True:
    total_length = len(tokens_a) + len(tokens_b)
    # 若总长小于等于最大长度则跳出循环
    if total_length <= max_length:
      break
    # 若总长大于最大长度，
    # 则根据句子对的长短依次pop超出的部分直到符合要求。
    if len(tokens_a) > len(tokens_b):
      tokens_a.pop()
    else:
      tokens_b.pop()
```
该函数用于处理句子对输入时，总长超出最大长度的情况。

## create_model
```python
def create_model(bert_config, is_training, input_ids, input_mask, segment_ids,
                 labels, num_labels, use_one_hot_embeddings):
  """Creates a classification model."""
  # 初始化一个BERT模型
  model = modeling.BertModel(
      config=bert_config,
      is_training=is_training,
      input_ids=input_ids,
      input_mask=input_mask,
      token_type_ids=segment_ids,
      use_one_hot_embeddings=use_one_hot_embeddings)
  # In the demo, we are doing a simple classification task on the entire
  # segment.
  #
  # If you want to use the token-level output, use model.get_sequence_output()
  # instead.
  # 输出定义为pooling后的输出
  output_layer = model.get_pooled_output()
  hidden_size = output_layer.shape[-1].value
  # 生成一个对应输出层的截断正态分布的参数矩阵（标准差为0.02）
  output_weights = tf.get_variable(
      "output_weights", [num_labels, hidden_size],
      initializer=tf.truncated_normal_initializer(stddev=0.02))
  # 偏置设为0
  output_bias = tf.get_variable(
      "output_bias", [num_labels], initializer=tf.zeros_initializer())
  with tf.variable_scope("loss"):
    if is_training:
      # I.e., 0.1 dropout
      # 为了减弱过拟合，将dropout的保持概率设为0.9
      output_layer = tf.nn.dropout(output_layer, keep_prob=0.9)
    # W_t * x + b 输出未归一化的“概率”logits，对应num_labels个label
    logits = tf.matmul(output_layer, output_weights, transpose_b=True)
    logits = tf.nn.bias_add(logits, output_bias)
    # 将digits经过softmax后得到对应num_labels个label的归一化输出
    probabilities = tf.nn.softmax(logits, axis=-1)
    log_probs = tf.nn.log_softmax(logits, axis=-1)
    # 为了计算样本误差，将label进行one-hot编码
    one_hot_labels = tf.one_hot(labels, depth=num_labels, dtype=tf.float32)
    # 计算每个样本对应标签的误差
    per_example_loss = -tf.reduce_sum(one_hot_labels * log_probs, axis=-1)
    # 得到平均误差（应该是交叉熵）
    loss = tf.reduce_mean(per_example_loss)
    # 返回平均误差loss，包含每个对应label误差的样本误差per_example_loss，未归一化的概率logits，归一化后的概率probabilities。
    return (loss, per_example_loss, logits, probabilities)
```
该函数借助model.py的一些参数和方法建立了一个基于BERT模型的encoder + 单层神经网络分类器，是run_classifier.py算法实现的核心框架部分。
关于dropout的源码解释，参考 [https://blog.csdn.net/qq_20412595/article/details/82824830](https://blog.csdn.net/qq_20412595/article/details/82824830) 。
关于logits和softmax的理解，参考 [https://www.zhihu.com/question/60751553](https://www.zhihu.com/question/60751553) 。

## model_fn_builder
```python
def model_fn_builder(bert_config, num_labels, init_checkpoint, learning_rate,
                     num_train_steps, num_warmup_steps, use_tpu,
                     use_one_hot_embeddings):
  """Returns `model_fn` closure for TPUEstimator."""
  def model_fn(features, labels, mode, params):  # pylint: disable=unused-argument
    """The `model_fn` for TPUEstimator."""
    tf.logging.info("*** Features ***")
    for name in sorted(features.keys()):
      tf.logging.info("  name = %s, shape = %s" % (name, features[name].shape))
    input_ids = features["input_ids"]
    input_mask = features["input_mask"]
    segment_ids = features["segment_ids"]
    label_ids = features["label_ids"]
    is_real_example = None
    if "is_real_example" in features:
      is_real_example = tf.cast(features["is_real_example"], dtype=tf.float32)
    else:
      is_real_example = tf.ones(tf.shape(label_ids), dtype=tf.float32)
    is_training = (mode == tf.estimator.ModeKeys.TRAIN)
    (total_loss, per_example_loss, logits, probabilities) = create_model(
        bert_config, is_training, input_ids, input_mask, segment_ids, label_ids,
        num_labels, use_one_hot_embeddings)
    tvars = tf.trainable_variables()
    initialized_variable_names = {}
    scaffold_fn = None
    if init_checkpoint:
      (assignment_map, initialized_variable_names
      ) = modeling.get_assignment_map_from_checkpoint(tvars, init_checkpoint)
      if use_tpu:
        def tpu_scaffold():
          tf.train.init_from_checkpoint(init_checkpoint, assignment_map)
          return tf.train.Scaffold()
        scaffold_fn = tpu_scaffold
      else:
        tf.train.init_from_checkpoint(init_checkpoint, assignment_map)
    tf.logging.info("**** Trainable Variables ****")
    for var in tvars:
      init_string = ""
      if var.name in initialized_variable_names:
        init_string = ", *INIT_FROM_CKPT*"
      tf.logging.info("  name = %s, shape = %s%s", var.name, var.shape,
                      init_string)
    output_spec = None
    if mode == tf.estimator.ModeKeys.TRAIN:
      train_op = optimization.create_optimizer(
          total_loss, learning_rate, num_train_steps, num_warmup_steps, use_tpu)
      output_spec = tf.contrib.tpu.TPUEstimatorSpec(
          mode=mode,
          loss=total_loss,
          train_op=train_op,
          scaffold_fn=scaffold_fn)
    elif mode == tf.estimator.ModeKeys.EVAL:
      def metric_fn(per_example_loss, label_ids, logits, is_real_example):
        predictions = tf.argmax(logits, axis=-1, output_type=tf.int32)
        accuracy = tf.metrics.accuracy(
            labels=label_ids, predictions=predictions, weights=is_real_example)
        loss = tf.metrics.mean(values=per_example_loss, weights=is_real_example)
        return {
            "eval_accuracy": accuracy,
            "eval_loss": loss,
        }
      eval_metrics = (metric_fn,
                      [per_example_loss, label_ids, logits, is_real_example])
      output_spec = tf.contrib.tpu.TPUEstimatorSpec(
          mode=mode,
          loss=total_loss,
          eval_metrics=eval_metrics,
          scaffold_fn=scaffold_fn)
    else:
      output_spec = tf.contrib.tpu.TPUEstimatorSpec(
          mode=mode,
          predictions={"probabilities": probabilities},
          scaffold_fn=scaffold_fn)
    return output_spec
  return model_fn
```
\* 该函数用于建立BERT分类模型并将参数传入TPU，有关TPU的部分先搁置。

## input_fn_builder
```python
def input_fn_builder(features, seq_length, is_training, drop_remainder):
  """Creates an `input_fn` closure to be passed to TPUEstimator."""
  all_input_ids = []
  all_input_mask = []
  all_segment_ids = []
  all_label_ids = []
  for feature in features:
    all_input_ids.append(feature.input_ids)
    all_input_mask.append(feature.input_mask)
    all_segment_ids.append(feature.segment_ids)
    all_label_ids.append(feature.label_id)
  def input_fn(params):
    """The actual input function."""
    batch_size = params["batch_size"]
    num_examples = len(features)
    # This is for demo purposes and does NOT scale to large data sets. We do
    # not use Dataset.from_generator() because that uses tf.py_func which is
    # not TPU compatible. The right way to load data is with TFRecordReader.
    d = tf.data.Dataset.from_tensor_slices({
        "input_ids":
            tf.constant(
                all_input_ids, shape=[num_examples, seq_length],
                dtype=tf.int32),
        "input_mask":
            tf.constant(
                all_input_mask,
                shape=[num_examples, seq_length],
                dtype=tf.int32),
        "segment_ids":
            tf.constant(
                all_segment_ids,
                shape=[num_examples, seq_length],
                dtype=tf.int32),
        "label_ids":
            tf.constant(all_label_ids, shape=[num_examples], dtype=tf.int32),
    })
    if is_training:
      d = d.repeat()
      d = d.shuffle(buffer_size=100)
    d = d.batch(batch_size=batch_size, drop_remainder=drop_remainder)
    return d
  return input_fn
```
\* 该函数用于不基于文件将输入函数传入TPU，有关TPU的部分先搁置。

## convert_examples_to_features
```python
def convert_examples_to_features(examples, label_list, max_seq_length,
                                 tokenizer):
  """Convert a set of `InputExample`s to a list of `InputFeatures`."""
  features = []
  for (ex_index, example) in enumerate(examples):
    if ex_index % 10000 == 0:
      tf.logging.info("Writing example %d of %d" % (ex_index, len(examples)))
    feature = convert_single_example(ex_index, example, label_list,
                                     max_seq_length, tokenizer)
    features.append(feature)
  return features
```
该函数用于批量将InputExample类转换为InputFeatures类。

## \main:
```python
def main(_):
  # 将日志信息打印
  tf.logging.set_verbosity(tf.logging.INFO)
  
  # 建立关于数据处理器的字典
  processors = {
      "cola": ColaProcessor,
      "mnli": MnliProcessor,
      "mrpc": MrpcProcessor,
      "xnli": XnliProcessor,
  }
  
  # 验证do_lower_case的选择是否与checkpoint匹配
  tokenization.validate_case_matches_checkpoint(FLAGS.do_lower_case,
                                                FLAGS.init_checkpoint)
  
  # 保证至少在参数部分选择了train/eval/predict三个操作中的一种，否则报错
  if not FLAGS.do_train and not FLAGS.do_eval and not FLAGS.do_predict:
    raise ValueError(
        "At least one of `do_train`, `do_eval` or `do_predict' must be True.")
  
  # 输入BERT的配置文件
  bert_config = modeling.BertConfig.from_json_file(FLAGS.bert_config_file)
  
  # 如果参数部分设定的最大序列长度大于BERT的最大position embedding长度，则报错
  if FLAGS.max_seq_length > bert_config.max_position_embeddings:
    raise ValueError(
        "Cannot use sequence length %d because the BERT model "
        "was only trained up to sequence length %d" %
        (FLAGS.max_seq_length, bert_config.max_position_embeddings))
        
  # 创建参数设定的输出目录
  tf.gfile.MakeDirs(FLAGS.output_dir)
  
  # 传入任务名称
  task_name = FLAGS.task_name.lower()
  
  # 若任务不在数据处理器的字典中，则报错
  if task_name not in processors:
    raise ValueError("Task not found: %s" % (task_name))
    
  # 选择对应任务的数据处理器
  processor = processors[task_name]()
  
  # 传入数据处理器处理后的标签列表
  label_list = processor.get_labels()
  
  # 选择使用FullTokenizer分词，选择词典和是否小写
  tokenizer = tokenization.FullTokenizer(
      vocab_file=FLAGS.vocab_file, do_lower_case=FLAGS.do_lower_case)
      
  # TPU参数初始化
  tpu_cluster_resolver = None
  if FLAGS.use_tpu and FLAGS.tpu_name:
    tpu_cluster_resolver = tf.contrib.cluster_resolver.TPUClusterResolver(
        FLAGS.tpu_name, zone=FLAGS.tpu_zone, project=FLAGS.gcp_project)
  is_per_host = tf.contrib.tpu.InputPipelineConfig.PER_HOST_V2
  
  # TPU配置设定
  run_config = tf.contrib.tpu.RunConfig(
      cluster=tpu_cluster_resolver,
      master=FLAGS.master,
      model_dir=FLAGS.output_dir,
      save_checkpoints_steps=FLAGS.save_checkpoints_steps,
      tpu_config=tf.contrib.tpu.TPUConfig(
          iterations_per_loop=FLAGS.iterations_per_loop,
          num_shards=FLAGS.num_tpu_cores,
          per_host_input_for_training=is_per_host))
  
  train_examples = None
  num_train_steps = None
  num_warmup_steps = None
  
  # 训练部分初始化参数
  if FLAGS.do_train:
    # 通过数据处理器的函数获得训练样本
    train_examples = processor.get_train_examples(FLAGS.data_dir)
    # 实际训练步数 = 训练样本总数 / 批大小 * 训练轮数
    num_train_steps = int(
        len(train_examples) / FLAGS.train_batch_size * FLAGS.num_train_epochs)
    # warmup步数 = 实际训练步数 * 热身比例
    num_warmup_steps = int(num_train_steps * FLAGS.warmup_proportion)
  
  # BERT建模 
  model_fn = model_fn_builder(
      bert_config=bert_config,
      num_labels=len(label_list),
      init_checkpoint=FLAGS.init_checkpoint,
      learning_rate=FLAGS.learning_rate,
      num_train_steps=num_train_steps,
      num_warmup_steps=num_warmup_steps,
      use_tpu=FLAGS.use_tpu,
      use_one_hot_embeddings=FLAGS.use_tpu)
  # If TPU is not available, this will fall back to normal Estimator on CPU
  # or GPU.
  
  # 配置TPUEstimator（若没有TPU，则会使用CPU/GPU）
  estimator = tf.contrib.tpu.TPUEstimator(
      use_tpu=FLAGS.use_tpu,
      model_fn=model_fn,
      config=run_config,
      train_batch_size=FLAGS.train_batch_size,
      eval_batch_size=FLAGS.eval_batch_size,
      predict_batch_size=FLAGS.predict_batch_size)
  
  # 训练部分主题
  if FLAGS.do_train:
    # 指定输出训练数据的TFRecord文件的位置
    train_file = os.path.join(FLAGS.output_dir, "train.tf_record")
    # 批量将样本转化为包含features的TFRecord文件
    file_based_convert_examples_to_features(
        train_examples, label_list, FLAGS.max_seq_length, tokenizer, train_file)
    # 打印样本总数、批大小、实际训练步数
    tf.logging.info("***** Running training *****")
    tf.logging.info("  Num examples = %d", len(train_examples))
    tf.logging.info("  Batch size = %d", FLAGS.train_batch_size)
    tf.logging.info("  Num steps = %d", num_train_steps)
    # 基于文件解包并生成传入TPUEstimator的包含features的输入函数
    train_input_fn = file_based_input_fn_builder(
        input_file=train_file,
        seq_length=FLAGS.max_seq_length,
        is_training=True,
        drop_remainder=True)
    # 将features和实际训练步数传入TPUEstimator并开始训练
    estimator.train(input_fn=train_input_fn, max_steps=num_train_steps)
    
  # 评估阶段
  if FLAGS.do_eval:
    # 数据处理器获取评估集样本
    eval_examples = processor.get_dev_examples(FLAGS.data_dir)
    # 评估集样本个数
    num_actual_eval_examples = len(eval_examples)
    # 如果使用TPU
    if FLAGS.use_tpu:
      # TPU requires a fixed batch size for all batches, therefore the number
      # of examples must be a multiple of the batch size, or else examples
      # will get dropped. So we pad with fake examples which are ignored
      # later on. These do NOT count towards the metric (all tf.metrics
      # support a per-instance weight, and these get a weight of 0.0).
      # 如果（样本个数 / 批大小）不整除，则做padding充数使其可被整除
      while len(eval_examples) % FLAGS.eval_batch_size != 0:
        eval_examples.append(PaddingInputExample())
    # 建立评估TFRecord文件的目录
    eval_file = os.path.join(FLAGS.output_dir, "eval.tf_record")
    # 批量将样本转化为包含features的TFRecord文件
    file_based_convert_examples_to_features(
        eval_examples, label_list, FLAGS.max_seq_length, tokenizer, eval_file)
    # 打印实际样本个数、padding的样本个数、批大小
    tf.logging.info("***** Running evaluation *****")
    tf.logging.info("  Num examples = %d (%d actual, %d padding)",
                    len(eval_examples), num_actual_eval_examples,
                    len(eval_examples) - num_actual_eval_examples)
    tf.logging.info("  Batch size = %d", FLAGS.eval_batch_size)
    # This tells the estimator to run through the entire set.
    eval_steps = None
    # However, if running eval on the TPU, you will need to specify the
    # number of steps.
    # 如果使用TPU，需要确定评估阶段的步数。
    if FLAGS.use_tpu:
      # 断言函数确保（样本个数 / 批大小）整除，否则报错。
      assert len(eval_examples) % FLAGS.eval_batch_size == 0
      # 实际评估步数即为整除后的得到的整数
      # 可以看到这里写程序的同学十分谨慎，既用了整除“//”，又强制转换了类型为整型
      eval_steps = int(len(eval_examples) // FLAGS.eval_batch_size)
    # 如果使用TPU则用drop_remainder，否则不用。
    eval_drop_remainder = True if FLAGS.use_tpu else False
    # 基于文件解包并生成传入TPUEstimator的包含features的输入函数
    eval_input_fn = file_based_input_fn_builder(
        input_file=eval_file,
        seq_length=FLAGS.max_seq_length,
        is_training=False,
        drop_remainder=eval_drop_remainder)
    # 将features和实际评估步数传入TPUEstimator并开始评估
    result = estimator.evaluate(input_fn=eval_input_fn, steps=eval_steps)
    # 创建评估结果的txt文档
    output_eval_file = os.path.join(FLAGS.output_dir, "eval_results.txt")
    # 向评估结果的txt文档写入result返回的四个参数
    # eval_accuracy、eval_loss、global_step、loss
    # *目前不知道这几个参数的具体含义，需要进一步查看estimator.evaluate返回的参数是如何定义的。
    with tf.gfile.GFile(output_eval_file, "w") as writer:
      tf.logging.info("***** Eval results *****")
      for key in sorted(result.keys()):
        # 屏幕打印
        tf.logging.info("  %s = %s", key, str(result[key]))
        # 写入txt文件
        writer.write("%s = %s\n" % (key, str(result[key])))
  
  # 预测阶段
  if FLAGS.do_predict:
    # 传入预测样本
    predict_examples = processor.get_test_examples(FLAGS.data_dir)
    # 预测样本总数
    num_actual_predict_examples = len(predict_examples)
    # 如果使用TPU
    if FLAGS.use_tpu:
      # TPU requires a fixed batch size for all batches, therefore the number
      # of examples must be a multiple of the batch size, or else examples
      # will get dropped. So we pad with fake examples which are ignored
      # later on.
      # 若样本总数不能整除batch，则padding样本充数。
      while len(predict_examples) % FLAGS.predict_batch_size != 0:
        predict_examples.append(PaddingInputExample())
    # 创建TFRecord文件目录
    predict_file = os.path.join(FLAGS.output_dir, "predict.tf_record")
    # 批量将样本转化为包含features的TFRecord文件
    file_based_convert_examples_to_features(predict_examples, label_list,
                                            FLAGS.max_seq_length, tokenizer,
                                            predict_file)
    # 打印实际样本数、padding样本数、批大小
    tf.logging.info("***** Running prediction*****")
    tf.logging.info("  Num examples = %d (%d actual, %d padding)",
                    len(predict_examples), num_actual_predict_examples,
                    len(predict_examples) - num_actual_predict_examples)
    tf.logging.info("  Batch size = %d", FLAGS.predict_batch_size)
    # 如果使用TPU则用drop_remainder，否则不用。
    predict_drop_remainder = True if FLAGS.use_tpu else False
    # 基于文件解包并生成传入TPUEstimator的包含features的输入函数
    predict_input_fn = file_based_input_fn_builder(
        input_file=predict_file,
        seq_length=FLAGS.max_seq_length,
        is_training=False,
        drop_remainder=predict_drop_remainder)
    # 开始预测
    result = estimator.predict(input_fn=predict_input_fn)
    # 创建预测结果的tsv文件
    output_predict_file = os.path.join(FLAGS.output_dir, "test_results.tsv")
    # 写入tsv文件
    with tf.gfile.GFile(output_predict_file, "w") as writer:
      num_written_lines = 0
      tf.logging.info("***** Predict results *****")
      # 按照标签顺序写入每个预测样本对应标签的概率
      # *需要进一步查看estimator.predict返回的数据是如何定义的
      for (i, prediction) in enumerate(result):
        probabilities = prediction["probabilities"]
        if i >= num_actual_predict_examples:
          break
        output_line = "\t".join(
            str(class_probability)
            for class_probability in probabilities) + "\n"
        writer.write(output_line)
        num_written_lines += 1
    # 断言函数保证写入tsv的行数与预测样本总数相同，否则报错。
    assert num_written_lines == num_actual_predict_examples
```
主函数部分。

## if __name__ == "__main__":
```python
# 主函数调用
if __name__ == "__main__":
  # 将data_dir、task_name、vocab_file、bert_config_file、output_dir设置为必要参数
  flags.mark_flag_as_required("data_dir")
  flags.mark_flag_as_required("task_name")
  flags.mark_flag_as_required("vocab_file")
  flags.mark_flag_as_required("bert_config_file")
  flags.mark_flag_as_required("output_dir")
  # 该函数会先处理flag之后默认运行main函数
  tf.app.run()
```
flag处理以及主函数调用。
tf.app.run()的源码解释详见 [https://blog.csdn.net/helei001/article/details/51859423](https://blog.csdn.net/helei001/article/details/51859423)

```python
def run(main=None):
f = flags.FLAGS
f._parse_flags()
main = main or sys.modules['__main__'].main
sys.exit(main(sys.argv))
```

## 后记
run_classifier.py的代码官方给出了982行，我写这篇文章写了两天，前期准备不知道用了多久，因为一直在看这个分类器的代码。说实话准备充分的话看起来还是很轻松的，但几个月之前刚下BERT看这个分类器的代码的时候真的是一头雾水，即便我已经大致了解了BERT的实际工作原理。

还剩下一些关于TPUEstimator参数配置的部分没加注释，还有一些关于评估阶段测试阶段的result返回数据没确认。之后会继续补齐。