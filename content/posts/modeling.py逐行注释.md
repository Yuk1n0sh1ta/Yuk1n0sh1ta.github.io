---
title: modeling.py逐行注释
date: '2020-09-03 12:30:00'
category: 学习
tags:
  - NLP
  - BERT
  - python
draft: false
---

* 本文为BERT的modeling.py模块，即建模模块，进行逐行注释。

# modeling.py
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
## BertConfig
```python
class BertConfig(object):
  """Configuration for `BertModel`."""
  def __init__(self,
               vocab_size,
               hidden_size=768,
               num_hidden_layers=12,
               num_attention_heads=12,
               intermediate_size=3072,
               hidden_act="gelu",
               hidden_dropout_prob=0.1,
               attention_probs_dropout_prob=0.1,
               max_position_embeddings=512,
               type_vocab_size=16,
               initializer_range=0.02):
    """Constructs BertConfig.
    Args:
      vocab_size: Vocabulary size of `inputs_ids` in `BertModel`.
      hidden_size: Size of the encoder layers and the pooler layer.
      num_hidden_layers: Number of hidden layers in the Transformer encoder.
      num_attention_heads: Number of attention heads for each attention layer in
        the Transformer encoder.
      intermediate_size: The size of the "intermediate" (i.e., feed-forward)
        layer in the Transformer encoder.
      hidden_act: The non-linear activation function (function or string) in the
        encoder and pooler.
      hidden_dropout_prob: The dropout probability for all fully connected
        layers in the embeddings, encoder, and pooler.
      attention_probs_dropout_prob: The dropout ratio for the attention
        probabilities.
      max_position_embeddings: The maximum sequence length that this model might
        ever be used with. Typically set this to something large just in case
        (e.g., 512 or 1024 or 2048).
      type_vocab_size: The vocabulary size of the `token_type_ids` passed into
        `BertModel`.
      initializer_range: The stdev of the truncated_normal_initializer for
        initializing all weight matrices.
    """
    # 将参数init为该类的属性
    self.vocab_size = vocab_size
    self.hidden_size = hidden_size
    self.num_hidden_layers = num_hidden_layers
    self.num_attention_heads = num_attention_heads
    self.hidden_act = hidden_act
    self.intermediate_size = intermediate_size
    self.hidden_dropout_prob = hidden_dropout_prob
    self.attention_probs_dropout_prob = attention_probs_dropout_prob
    self.max_position_embeddings = max_position_embeddings
    self.type_vocab_size = type_vocab_size
    self.initializer_range = initializer_range
  
  # 从python字典中读取BERT的配置参数
  @classmethod
  def from_dict(cls, json_object):
    """Constructs a `BertConfig` from a Python dictionary of parameters."""
    config = BertConfig(vocab_size=None)
    for (key, value) in six.iteritems(json_object):
      config.__dict__[key] = value
    return config
    
  # 从json文件中读取BERT的配置参数
  @classmethod
  def from_json_file(cls, json_file):
    """Constructs a `BertConfig` from a json file of parameters."""
    with tf.gfile.GFile(json_file, "r") as reader:
      text = reader.read()
    return cls.from_dict(json.loads(text))
    
  # 将实体序列化为python字典
  def to_dict(self):
    """Serializes this instance to a Python dictionary."""
    output = copy.deepcopy(self.__dict__)
    return output
  
  # 将实体序列化为json字符串
  def to_json_string(self):
    """Serializes this instance to a JSON string."""
    return json.dumps(self.to_dict(), indent=2, sort_keys=True) + "\n"
```
该类用于存储BERT参数。
各参数意义：
1. vocab_size：inputs_ids的Vocabulary的大小
2. hidden_size：隐藏层（编码层/pooler层）的大小
3. num_hidden_layers：Transformer编码器的hidden层个数
4. num_attention_heads：Transformer编码器的注意力头个数
5. intermediate_size：中间层（FFN）大小
6. hidden_act：隐藏层（编码层/pooler层）激活函数
7. hidden_dropout_prob：隐藏层（embedding层/编码层/pooler层）dropout概率
8. attention_probs_dropout_prob：注意力概率的dropout概率
9. max_position_embeddings：最大序列长度（512/1024/2048）
10. type_vocab_size：token_type_ids的Vocabulary的大小（\*有篇文章说这个是segement_id???）
11. initializer_range：设置个参数矩阵初始值时truncated_normal_initializer的标准差

默认值：
vocab_size,
hidden_size=768,
num_hidden_layers=12,
num_attention_heads=12,
intermediate_size=3072,
hidden_act="gelu",
hidden_dropout_prob=0.1,
attention_probs_dropout_prob=0.1,
max_position_embeddings=512,
type_vocab_size=16,
initializer_range=0.02

## BertModel
```python
class BertModel(object):
  """BERT model ("Bidirectional Encoder Representations from Transformers").
  Example usage:
  \\\python
  # Already been converted into WordPiece token ids
  input_ids = tf.constant([[31, 51, 99], [15, 5, 0]])
  input_mask = tf.constant([[1, 1, 1], [1, 1, 0]])
  token_type_ids = tf.constant([[0, 0, 1], [0, 2, 0]])
  config = modeling.BertConfig(vocab_size=32000, hidden_size=512,
    num_hidden_layers=8, num_attention_heads=6, intermediate_size=1024)
  model = modeling.BertModel(config=config, is_training=True,
    input_ids=input_ids, input_mask=input_mask, token_type_ids=token_type_ids)
  label_embeddings = tf.get_variable(...)
  pooled_output = model.get_pooled_output()
  logits = tf.matmul(pooled_output, label_embeddings)
  ...
  \\\
  """
  def __init__(self,
               config,
               is_training,
               input_ids,
               input_mask=None,
               token_type_ids=None,
               use_one_hot_embeddings=False,
               scope=None):
    """Constructor for BertModel.
    Args:
      config: `BertConfig` instance.
      is_training: bool. true for training model, false for eval model. Controls
        whether dropout will be applied.
      input_ids: int32 Tensor of shape [batch_size, seq_length].
      input_mask: (optional) int32 Tensor of shape [batch_size, seq_length].
      token_type_ids: (optional) int32 Tensor of shape [batch_size, seq_length].
      use_one_hot_embeddings: (optional) bool. Whether to use one-hot word
        embeddings or tf.embedding_lookup() for the word embeddings.
      scope: (optional) variable scope. Defaults to "bert".
    Raises:
      ValueError: The config is invalid or one of the input tensor shapes
        is invalid.
    """
    config = copy.deepcopy(config)
    
    # 若不是训练，则将隐藏层以及注意力概率的dropout设置为0
    if not is_training:
      config.hidden_dropout_prob = 0.0
      config.attention_probs_dropout_prob = 0.0
    
    # 获取input_id的形状列表
    # 期待的rank为2，若实际值不是2，则报错
    # 猜测input_ids的格式为
    # [[10, 200, 3000, 40000], 
    #  [20, 300, 4000, 50000],]
    # 例子中的batch_size为2，seq_length为4。
    input_shape = get_shape_list(input_ids, expected_rank=2)
    batch_size = input_shape[0]
    seq_length = input_shape[1]
    
    # 若input_mask为None，
    # 则为其创立一个与input_ids同shape的矩阵。
    if input_mask is None:
      input_mask = tf.ones(shape=[batch_size, seq_length], dtype=tf.int32)
    
    # 若token_type_ids为None，
    # 则为其创立一个与input_ids同shape的矩阵。
    if token_type_ids is None:
      token_type_ids = tf.zeros(shape=[batch_size, seq_length], dtype=tf.int32)
    
    # BERT模型主体
    with tf.variable_scope(scope, default_name="bert"):
      
      # embedding部分
      with tf.variable_scope("embeddings"):
        # Perform embedding lookup on the word ids.
        # 得到word_embedding输出 以及
        # input_ids到word_embedding输出的变换矩阵embedding_table
        # 旨在将vocab_size的one-hot编码的输入转化为hidden_size的tensor
        (self.embedding_output, self.embedding_table) = embedding_lookup(
            # 输入id
            input_ids=input_ids,
            # vocabulary大小
            vocab_size=config.vocab_size,
            # embedding大小（隐藏层大小）
            embedding_size=config.hidden_size,
            # 初始化参数矩阵的标准差
            initializer_range=config.initializer_range,
            #  word_embedding命名
            word_embedding_name="word_embeddings",
            # 是否使用one-hot编码
            use_one_hot_embeddings=use_one_hot_embeddings)
        # Add positional embeddings and token type embeddings, then layer
        # normalize and perform dropout.
        # 得到positional_embedding以及
        # token_type_embedding（segment_embedding）
        self.embedding_output = embedding_postprocessor(
            # 输入张量为上一轮输出的包含word_embedding的embedding_output
            input_tensor=self.embedding_output,
            # 是否使用segment_embedding
            use_token_type=True,
            # segment_embedding赋值
            token_type_ids=token_type_ids,
            # token_type_ids的vocabulary大小
            token_type_vocab_size=config.type_vocab_size,
            # token_type_embedding命名
            token_type_embedding_name="token_type_embeddings",
            # 是否使用positional_embedding
            use_position_embeddings=True,
            # position_embedding命名
            position_embedding_name="position_embeddings",
            # 参数矩阵初始化的正态分布标准差
            initializer_range=config.initializer_range,
            # 最长序列长度
            max_position_embeddings=config.max_position_embeddings,
            # 隐藏层dropout概率
            dropout_prob=config.hidden_dropout_prob)
      
      # encoder部分
      with tf.variable_scope("encoder"):
        # This converts a 2D mask of shape [batch_size, seq_length] to a 3D
        # mask of shape [batch_size, seq_length, seq_length] which is used
        # for the attention scores.
        # 将[batch_size, seq_length]转化为[batch_size, seq_length, seq_length]
        # 用于计算attention scores
        attention_mask = create_attention_mask_from_input_mask(
            input_ids, input_mask)
        # Run the stacked transformer.
        # `sequence_output` shape = [batch_size, seq_length, hidden_size].
        # 多层Transformer模型
        self.all_encoder_layers = transformer_model(
            # 输入相加后的word_embedding、segment_embedding、positioanl embedding
            input_tensor=self.embedding_output,
            # attention掩码[batch_size, seq_length, seq_length]
            attention_mask=attention_mask,
            # 隐藏层大小
            hidden_size=config.hidden_size,
            # 隐藏层层数
            num_hidden_layers=config.num_hidden_layers,
            # attention头个数
            num_attention_heads=config.num_attention_heads,
            # 中间层大小
            intermediate_size=config.intermediate_size,
            # 中间层激活函数
            intermediate_act_fn=get_activation(config.hidden_act),
            # 隐藏层dropout概率
            hidden_dropout_prob=config.hidden_dropout_prob,
            # attention概率的dropout概率
            attention_probs_dropout_prob=config.attention_probs_dropout_prob,
            # 参数初始化正态分布的标准差
            initializer_range=config.initializer_range,
            # 是否返回所有层输出
            do_return_all_layers=True)    
      # 选择最终的Transformer输出为最后一层
      self.sequence_output = self.all_encoder_layers[-1]
      
      # pooler部分
      # The "pooler" converts the encoded sequence tensor of shape
      # [batch_size, seq_length, hidden_size] to a tensor of shape
      # [batch_size, hidden_size]. This is necessary for segment-level
      # (or segment-pair-level) classification tasks where we need a fixed
      # dimensional representation of the segment.
      with tf.variable_scope("pooler"):
        # We "pool" the model by simply taking the hidden state corresponding
        # to the first token. We assume that this has been pre-trained
        # 取序列中的第一个token（[CLS]）jingguo Transformer的output
        first_token_tensor = tf.squeeze(self.sequence_output[:, 0:1, :], axis=1)
        # 建立一个输出为hidden_size的全连接网络
        # 将Transformer的输出维度pooling为固定长度
        self.pooled_output = tf.layers.dense(
            # 输入张量
            first_token_tensor,
            # 输出维度
            config.hidden_size,
            # 激活函数
            activation=tf.tanh,
            # 参数初始化
            kernel_initializer=create_initializer(config.initializer_range))
  
  # 获取pooled输出（返回pooling的[CLS]输出）
  def get_pooled_output(self):
    return self.pooled_output
  
  # 获取序列输出（返回Transfomer最后一层的全部输出）
  def get_sequence_output(self):
    """Gets final hidden layer of encoder.
    Returns:
      float Tensor of shape [batch_size, seq_length, hidden_size] corresponding
      to the final hidden of the transformer encoder.
    """
    return self.sequence_output
  
  # 获取Transformer中所有encoder层的输出
  def get_all_encoder_layers(self):
    return self.all_encoder_layers
  
  # 获取normalization之后的
  # word_embedding、segment_embedding、positioinal_embedding的和
  def get_embedding_output(self):
    """Gets output of the embedding lookup (i.e., input to the transformer).
    Returns:
      float Tensor of shape [batch_size, seq_length, hidden_size] corresponding
      to the output of the embedding layer, after summing the word
      embeddings with the positional embeddings and the token type embeddings,
      then performing layer normalization. This is the input to the transformer.
    """
    return self.embedding_output
    
  # 获取input_ids到word_embedding输出的变换矩阵
  def get_embedding_table(self):
    return self.embedding_table
```
该类是BERT模型的主体部分，包含了从 **input_ids -> embedding -> Transfomer输出张量** 的所需方法。

## gelu
```python
def gelu(x):
  """Gaussian Error Linear Unit.
  This is a smoother version of the RELU.
  Original paper: https://arxiv.org/abs/1606.08415
  Args:
    x: float Tensor to perform activation.
  Returns:
    `x` with the GELU activation applied.
  """
  cdf = 0.5 * (1.0 + tf.tanh(
      (np.sqrt(2 / np.pi) * (x + 0.044715 * tf.pow(x, 3)))))
  return x * cdf
```
定义gelu函数。

## get_activation
```python
def get_activation(activation_string):
  """Maps a string to a Python function, e.g., "relu" => `tf.nn.relu`.
  Args:
    activation_string: String name of the activation function.
  Returns:
    A Python function corresponding to the activation function. If
    `activation_string` is None, empty, or "linear", this will return None.
    If `activation_string` is not a string, it will return `activation_string`.
  Raises:
    ValueError: The `activation_string` does not correspond to a known
      activation.
  """
  # We assume that anything that"s not a string is already an activation
  # function, so we just return it.
  # 判断activation_string是否为six.string_types字符串
  # 若非字符串，则视为已经是定义好的激活函数，直接返回activation_string。
  if not isinstance(activation_string, six.string_types):
    return activation_string
    
  # 若是字符串，但字符串为空，则返回None。
  if not activation_string:
    return None
  
  # 若是字符串，且不为空，则将该字符串强制小写。
  act = activation_string.lower()
  
  # 判断激活函数类型
  if act == "linear":
    return None
  elif act == "relu":
    return tf.nn.relu
  elif act == "gelu":
    return gelu
  elif act == "tanh":
    return tf.tanh
  else:
    # 若非linear、relu、gelu、tanh，则报错不支持的激活函数。
    raise ValueError("Unsupported activation: %s" % act)
```
该函数用于通过输入字符串调用不同的激活函数。

## get_assignment_map_from_checkpoint
```python
def get_assignment_map_from_checkpoint(tvars, init_checkpoint):
  """Compute the union of the current variables and checkpoint variables."""
  assignment_map = {}
  initialized_variable_names = {}
  name_to_variable = collections.OrderedDict()
  for var in tvars:
    name = var.name
    m = re.match("^(.*):\\d+$", name)
    if m is not None:
      name = m.group(1)
    name_to_variable[name] = var
  init_vars = tf.train.list_variables(init_checkpoint)
  assignment_map = collections.OrderedDict()
  for x in init_vars:
    (name, var) = (x[0], x[1])
    if name not in name_to_variable:
      continue
    assignment_map[name] = name
    initialized_variable_names[name] = 1
    initialized_variable_names[name + ":0"] = 1
  return (assignment_map, initialized_variable_names)
```
\* 没看明白，需要结合run_classifier一起看。

## dropout
```python
def dropout(input_tensor, dropout_prob):
  """Perform dropout.
  Args:
    input_tensor: float Tensor.
    dropout_prob: Python float. The probability of dropping out a value (NOT of
      *keeping* a dimension as in `tf.nn.dropout`).
  Returns:
    A version of `input_tensor` with dropout applied.
  """
  # 若dropout_prob为空或为0，则不对张量进行dropout，直接返回原张量。
  if dropout_prob is None or dropout_prob == 0.0:
    return input_tensor
  
  # 否则，使用tf.nn.dropout对张量进行概率dropout。
  output = tf.nn.dropout(input_tensor, 1.0 - dropout_prob)
  return output
```
定义输入张量的dropout规则。

## layer_norm
```python
def layer_norm(input_tensor, name=None):
  """Run layer normalization on the last dimension of the tensor."""
  return tf.contrib.layers.layer_norm(
      inputs=input_tensor, begin_norm_axis=-1, begin_params_axis=-1, scope=name)
```
该函数用于对张量的最后一个维度进行层级的normalization。
\* 具体参数意义需进一步查看源码，位置：
`C:\Users\你的用户名\AppData\Local\Programs\Python\Python37\Lib\site-packages\tensorflow_core\contrib\layers\python\layers.py`

## layer_norm_and_dropout
```python
def layer_norm_and_dropout(input_tensor, dropout_prob, name=None):
  """Runs layer normalization followed by dropout."""
  output_tensor = layer_norm(input_tensor, name)
  output_tensor = dropout(output_tensor, dropout_prob)
  return output_tensor
```
该函数用于层级的normalization以及dropout。

## create_initializer
```
def create_initializer(initializer_range=0.02):
  """Creates a `truncated_normal_initializer` with the given range."""
  return tf.truncated_normal_initializer(stddev=initializer_range)
```
该函数用于生成一个指定标准差的参数矩阵initializer。

## embedding_lookup
```python
def embedding_lookup(input_ids,
                     vocab_size,
                     embedding_size=128,
                     initializer_range=0.02,
                     word_embedding_name="word_embeddings",
                     use_one_hot_embeddings=False):
  """Looks up words embeddings for id tensor.
  Args:
    input_ids: int32 Tensor of shape [batch_size, seq_length] containing word
      ids.
    vocab_size: int. Size of the embedding vocabulary.
    embedding_size: int. Width of the word embeddings.
    initializer_range: float. Embedding initialization range.
    word_embedding_name: string. Name of the embedding table.
    use_one_hot_embeddings: bool. If True, use one-hot method for word
      embeddings. If False, use `tf.gather()`.
  Returns:
    float Tensor of shape [batch_size, seq_length, embedding_size].
  """
  # This function assumes that the input is of shape [batch_size, seq_length,
  # num_inputs].
  #
  # If the input is a 2D tensor of shape [batch_size, seq_length], we
  # reshape to [batch_size, seq_length, 1].
  # 如果张量的维度为2（[batch_size, seq_length]），
  # 则将其扩张为[batch_size, seq_length, 1]。
  if input_ids.shape.ndims == 2:
    input_ids = tf.expand_dims(input_ids, axis=[-1])
  
  # 使用create_initializer创建一个shape为[vocab_size, embedding_size]的参数矩阵
  embedding_table = tf.get_variable(
      name=word_embedding_name,
      shape=[vocab_size, embedding_size],
      initializer=create_initializer(initializer_range))
  
  # 将多维度的input_ids扁平化reshape为1维向量
  flat_input_ids = tf.reshape(input_ids, [-1])
  
  # 如果使用one hot编码，则将扁平化后的input_ids转化为vocab_size深度的one hot向量。
  if use_one_hot_embeddings:
    one_hot_input_ids = tf.one_hot(flat_input_ids, depth=vocab_size)
    # 将编码后的input_ids与参数矩阵相乘得到输出
    output = tf.matmul(one_hot_input_ids, embedding_table)
  # 否则根据扁平化后的flat_input_ids从embedding_table中抽出与ids对应的向量作为输出
  else:
    output = tf.gather(embedding_table, flat_input_ids)
    
  # 获取input_ids的shape
  input_shape = get_shape_list(input_ids)
  
  # 将扁平化的output重新reshape为[batch_size, seq_length, embedding_size]的形式
  output = tf.reshape(output,
                      input_shape[0:-1] + [input_shape[-1] * embedding_size])
                      
  # 返回输出的word_embedding以及参数矩阵embedding_table
  return (output, embedding_table)
```
该函数用于将整型的input_ids转换为hidden_size维的浮点型张量后输出，并获取转换过程中的参数矩阵，即embedding_table。

## create_attention_mask_from_input_mask
```python
def create_attention_mask_from_input_mask(from_tensor, to_mask):
  """Create 3D attention mask from a 2D tensor mask.
  Args:
    from_tensor: 2D or 3D Tensor of shape [batch_size, from_seq_length, ...].
    to_mask: int32 Tensor of shape [batch_size, to_seq_length].
  Returns:
    float Tensor of shape [batch_size, from_seq_length, to_seq_length].
  """
  
  # 获取输入张量的shape，[batch_size, from_seq_length]。
  from_shape = get_shape_list(from_tensor, expected_rank=[2, 3])
  
  # shape的首位是batch_size
  batch_size = from_shape[0]
  
  # shape的次位是from_seq_length
  from_seq_length = from_shape[1]
  
  # 获取to_mask的shape，[batch_size, to_seq_length]。
  to_shape = get_shape_list(to_mask, expected_rank=2)
  
  # shape的次位是to_seq_length
  to_seq_length = to_shape[1]
  
  # 将to_mask的形状reshape为[batch_size, 1, to_seq_length]，并将元素类型转换为float。
  to_mask = tf.cast(
      tf.reshape(to_mask, [batch_size, 1, to_seq_length]), tf.float32)
  # We don't assume that `from_tensor` is a mask (although it could be). We
  # don't actually care if we attend *from* padding tokens (only *to* padding)
  # tokens so we create a tensor of all ones.
  #
  # `broadcast_ones` = [batch_size, from_seq_length, 1]
  # 生成一个shape为[batch_size, from_seq_length, 1]的元素均为1的矩阵
  broadcast_ones = tf.ones(
      shape=[batch_size, from_seq_length, 1], dtype=tf.float32)
  # Here we broadcast along two dimensions to create the mask.
  # 相乘后，会生成一个[batch_size, from_seq_length,to_seq_length]的张量。
  # 即相乘时，两个张量的第一个维度batch_size部分保持不变，
  # [from_seq_length, 1]和[1, to_seq_length]部分按照矩阵相乘
  # 得到一个[from_seq_length,to_seq_length]的矩阵。
  mask = broadcast_ones * to_mask
  
  # 返回输入张量的mask张量
  return mask
```
该函数基于2D的输入input_ids以及该输入的input_mask，生成3D的attention_mask。
相关理解参考 [https://www.cnblogs.com/gczr/p/12382240.html](https://www.cnblogs.com/gczr/p/12382240.html) 的第四部分，构造 attention_mask。

## attention_layer
```python
def attention_layer(from_tensor,
                    to_tensor,
                    attention_mask=None,
                    num_attention_heads=1,
                    size_per_head=512,
                    query_act=None,
                    key_act=None,
                    value_act=None,
                    attention_probs_dropout_prob=0.0,
                    initializer_range=0.02,
                    do_return_2d_tensor=False,
                    batch_size=None,
                    from_seq_length=None,
                    to_seq_length=None):
  """Performs multi-headed attention from `from_tensor` to `to_tensor`.
  This is an implementation of multi-headed attention based on "Attention
  is all you Need". If `from_tensor` and `to_tensor` are the same, then
  this is self-attention. Each timestep in `from_tensor` attends to the
  corresponding sequence in `to_tensor`, and returns a fixed-with vector.
  This function first projects `from_tensor` into a "query" tensor and
  `to_tensor` into "key" and "value" tensors. These are (effectively) a list
  of tensors of length `num_attention_heads`, where each tensor is of shape
  [batch_size, seq_length, size_per_head].
  Then, the query and key tensors are dot-producted and scaled. These are
  softmaxed to obtain attention probabilities. The value tensors are then
  interpolated by these probabilities, then concatenated back to a single
  tensor and returned.
  In practice, the multi-headed attention are done with transposes and
  reshapes rather than actual separate tensors.
  Args:
    from_tensor: float Tensor of shape [batch_size, from_seq_length,
      from_width].
    to_tensor: float Tensor of shape [batch_size, to_seq_length, to_width].
    attention_mask: (optional) int32 Tensor of shape [batch_size,
      from_seq_length, to_seq_length]. The values should be 1 or 0. The
      attention scores will effectively be set to -infinity for any positions in
      the mask that are 0, and will be unchanged for positions that are 1.
    num_attention_heads: int. Number of attention heads.
    size_per_head: int. Size of each attention head.
    query_act: (optional) Activation function for the query transform.
    key_act: (optional) Activation function for the key transform.
    value_act: (optional) Activation function for the value transform.
    attention_probs_dropout_prob: (optional) float. Dropout probability of the
      attention probabilities.
    initializer_range: float. Range of the weight initializer.
    do_return_2d_tensor: bool. If True, the output will be of shape [batch_size
      * from_seq_length, num_attention_heads * size_per_head]. If False, the
      output will be of shape [batch_size, from_seq_length, num_attention_heads
      * size_per_head].
    batch_size: (Optional) int. If the input is 2D, this might be the batch size
      of the 3D version of the `from_tensor` and `to_tensor`.
    from_seq_length: (Optional) If the input is 2D, this might be the seq length
      of the 3D version of the `from_tensor`.
    to_seq_length: (Optional) If the input is 2D, this might be the seq length
      of the 3D version of the `to_tensor`.
  Returns:
    float Tensor of shape [batch_size, from_seq_length,
      num_attention_heads * size_per_head]. (If `do_return_2d_tensor` is
      true, this will be of shape [batch_size * from_seq_length,
      num_attention_heads * size_per_head]).
  Raises:
    ValueError: Any of the arguments or tensor shapes are invalid.
  """
  # 为了计算score，将输入的张量的维度顺序进行调整。
  # 这里的transpose不是指的转置，而是指的顺序调整。
  def transpose_for_scores(input_tensor, batch_size, num_attention_heads,
                           seq_length, width):    
    # 将[batch_size*seq_length, num_attention_heads*width]的相对扁平的张量
    # reshape为高维度的[batch_size, seq_length, num_attention_heads, width]
    output_tensor = tf.reshape(
        input_tensor, [batch_size, seq_length, num_attention_heads, width])
    # 调换张量的两个维度seq_length, num_attention_heads的顺序
    output_tensor = tf.transpose(output_tensor, [0, 2, 1, 3])
    # 返回输出张量
    return output_tensor
    
  # 获得from_tensor和to_tensor的shape
  # 在self-attention中，from_tensor和to_tensor相同。
  from_shape = get_shape_list(from_tensor, expected_rank=[2, 3])
  to_shape = get_shape_list(to_tensor, expected_rank=[2, 3])
  
  # 若from_tensor和to_tensor的shape不同，则报错。
  if len(from_shape) != len(to_shape):
    raise ValueError(
        "The rank of `from_tensor` must match the rank of `to_tensor`.")
        
  # 若from_tensor的维度为3，
  # 则为batch_size、from_seq_length、to_seq_length赋对应值。
  if len(from_shape) == 3:
    batch_size = from_shape[0]
    from_seq_length = from_shape[1]
    to_seq_length = to_shape[1]
  # 若from_tensor的维度为2
  elif len(from_shape) == 2:
    # 这必然报错啊
    # batch_size、from_seq_length、to_seq_length都没赋值啊。。。
    if (batch_size is None or from_seq_length is None or to_seq_length is None):
      raise ValueError(
          "When passing in rank 2 tensors to attention_layer, the values "
          "for `batch_size`, `from_seq_length`, and `to_seq_length` "
          "must all be specified.")
  # Scalar dimensions referenced here:
  #   B = batch size (number of sequences)
  #   F = `from_tensor` sequence length
  #   T = `to_tensor` sequence length
  #   N = `num_attention_heads`
  #   H = `size_per_head`
  # F和T虽然是两个变量，但实际值相同
  # from_tensor用于生成query
  # to_tensor用于生成key和value
  
  # 保留from_tensor、to_tensor的最后一个维度的信息，其他维度信息按顺序扁平化。
  # [ [ [1, 2],                      [ [1, 2],
  #     [2, 3] ],       ---\          [2, 3],
  #   [ [3, 4],         ---/          [3, 4],
  #     [4, 5] ] ]                    [4, 5] ]
  
  # [2, 2, 2]          --->         [4, 2]
  from_tensor_2d = reshape_to_matrix(from_tensor)
  to_tensor_2d = reshape_to_matrix(to_tensor)
  
  # 将原有的每个token的word_embedding宽度，通过一个全连接层，
  # 输出为query层、key层、value层num_attention_heads * size_per_head的向量宽度。
  
  # `query_layer` = [B*F, N*H]
  query_layer = tf.layers.dense(
      from_tensor_2d,
      num_attention_heads * size_per_head,
      activation=query_act,
      name="query",
      kernel_initializer=create_initializer(initializer_range))
  # `key_layer` = [B*T, N*H]
  key_layer = tf.layers.dense(
      to_tensor_2d,
      num_attention_heads * size_per_head,
      activation=key_act,
      name="key",
      kernel_initializer=create_initializer(initializer_range))
  # `value_layer` = [B*T, N*H]
  value_layer = tf.layers.dense(
      to_tensor_2d,
      num_attention_heads * size_per_head,
      activation=value_act,
      name="value",
      kernel_initializer=create_initializer(initializer_range))
  
  # 为了计算scores，将query层、key层的张量维度顺序进行调整。
  
  # `query_layer` = [B, N, F, H]
  query_layer = transpose_for_scores(query_layer, batch_size,
                                     num_attention_heads, from_seq_length,
                                     size_per_head)
  # `key_layer` = [B, N, T, H]
  key_layer = transpose_for_scores(key_layer, batch_size, num_attention_heads,
                                   to_seq_length, size_per_head)
                                   
  # Take the dot product between "query" and "key" to get the raw
  # attention scores.
  # 使用公式计算attention_scores
  
  # `attention_scores` = [B, N, F, T]
  attention_scores = tf.matmul(query_layer, key_layer, transpose_b=True)
  attention_scores = tf.multiply(attention_scores,
                                 1.0 / math.sqrt(float(size_per_head)))
  
  # 若attention_mask存在
  if attention_mask is not None:
    # 将attention_mask扩大一个维度
    # `attention_mask` = [B, 1, F, T]
    attention_mask = tf.expand_dims(attention_mask, axis=[1])
    # Since attention_mask is 1.0 for positions we want to attend and 0.0 for
    # masked positions, this operation will create a tensor which is 0.0 for
    # positions we want to attend and -10000.0 for masked positions.
    # 若attention_mask为1.0，则adder被设置为0.0；
    # 若attention_mask为0.0，则adder被设置为-10000.0。
    adder = (1.0 - tf.cast(attention_mask, tf.float32)) * -10000.0
    # Since we are adding it to the raw scores before the softmax, this is
    # effectively the same as removing these entirely.
    # 为attention_scores加上这个带有mask信息的adder
    attention_scores += adder
  
  # Normalize the attention scores to probabilities.
  # 对attention_scores进行softmax归一化
  # `attention_probs` = [B, N, F, T]
  attention_probs = tf.nn.softmax(attention_scores)
  
  # This is actually dropping out entire tokens to attend to, which might
  # seem a bit unusual, but is taken from the original Transformer paper.
  # *对最终输出的attention_probs进行dropout
  attention_probs = dropout(attention_probs, attention_probs_dropout_prob)
  
  # 将[B*T, N*H]的value_layer张量reshape为[B, T, N, H]
  # `value_layer` = [B, T, N, H]
  value_layer = tf.reshape(
      value_layer,
      [batch_size, to_seq_length, num_attention_heads, size_per_head])
  
  # 调整value_layer的维度顺序
  # `value_layer` = [B, N, T, H]
  value_layer = tf.transpose(value_layer, [0, 2, 1, 3])
  
  # 将attention_probs和value_layer相乘，得到最终的context_layer。
  # `context_layer` = [B, N, F, H]
  context_layer = tf.matmul(attention_probs, value_layer)
  
  # 调整context_layer的维度顺序
  # `context_layer` = [B, F, N, H]
  context_layer = tf.transpose(context_layer, [0, 2, 1, 3])
  
  # 若将context_layer转为2d张量
  if do_return_2d_tensor:
    # 将[B, F, N, H]的context_layer张量reshape为[B*F, N*H]
    # `context_layer` = [B*F, N*H]
    context_layer = tf.reshape(
        context_layer,
        [batch_size * from_seq_length, num_attention_heads * size_per_head])
  # 否则将[B, F, N, H]的context_layer转为[B, F, N*H]
  else:
    # `context_layer` = [B, F, N*H]
    context_layer = tf.reshape(
        context_layer,
        [batch_size, from_seq_length, num_attention_heads * size_per_head])
  
  # 返回context_layer
  return context_layer
```
该函数用于将上层输入的word_embedding按照Transformer中的Masked Multi-Head Attention部分的原理转换为context_layer并输出。
具体原理可以参考 [如何理解 Transformer](/posts/2020-07-03-如何理解-transformer/#1-2-2-Multi-Head-Self-Attention) 。

## transformer_model
```python
def transformer_model(input_tensor,
                      attention_mask=None,
                      hidden_size=768,
                      num_hidden_layers=12,
                      num_attention_heads=12,
                      intermediate_size=3072,
                      intermediate_act_fn=gelu,
                      hidden_dropout_prob=0.1,
                      attention_probs_dropout_prob=0.1,
                      initializer_range=0.02,
                      do_return_all_layers=False):
  """Multi-headed, multi-layer Transformer from "Attention is All You Need".
  This is almost an exact implementation of the original Transformer encoder.
  See the original paper:
  https://arxiv.org/abs/1706.03762
  Also see:
  https://github.com/tensorflow/tensor2tensor/blob/master/tensor2tensor/models/transformer.py
  Args:
    input_tensor: float Tensor of shape [batch_size, seq_length, hidden_size].
    attention_mask: (optional) int32 Tensor of shape [batch_size, seq_length,
      seq_length], with 1 for positions that can be attended to and 0 in
      positions that should not be.
    hidden_size: int. Hidden size of the Transformer.
    num_hidden_layers: int. Number of layers (blocks) in the Transformer.
    num_attention_heads: int. Number of attention heads in the Transformer.
    intermediate_size: int. The size of the "intermediate" (a.k.a., feed
      forward) layer.
    intermediate_act_fn: function. The non-linear activation function to apply
      to the output of the intermediate/feed-forward layer.
    hidden_dropout_prob: float. Dropout probability for the hidden layers.
    attention_probs_dropout_prob: float. Dropout probability of the attention
      probabilities.
    initializer_range: float. Range of the initializer (stddev of truncated
      normal).
    do_return_all_layers: Whether to also return all layers or just the final
      layer.
  Returns:
    float Tensor of shape [batch_size, seq_length, hidden_size], the final
    hidden layer of the Transformer.
  Raises:
    ValueError: A Tensor shape or parameter is invalid.
  """
  # *若hidden_size不是num_attention_heads的整数倍，则报错。
  if hidden_size % num_attention_heads != 0:
    raise ValueError(
        "The hidden size (%d) is not a multiple of the number of attention "
        "heads (%d)" % (hidden_size, num_attention_heads))
  
  # 每个attention head的大小
  attention_head_size = int(hidden_size / num_attention_heads)
  
  # 获取输入张量的shape
  input_shape = get_shape_list(input_tensor, expected_rank=3)
  
  # 为batch_size、seq_length、input_width赋值
  batch_size = input_shape[0]
  seq_length = input_shape[1]
  input_width = input_shape[2]
  
  # The Transformer performs sum residuals on all layers so the input needs
  # to be the same as the hidden size.
  # 若input_width和hidden_size不一样大，则报错。
  if input_width != hidden_size:
    raise ValueError("The width of the input tensor (%d) != hidden size (%d)" %
                     (input_width, hidden_size))
                     
  # We keep the representation as a 2D tensor to avoid re-shaping it back and
  # forth from a 3D tensor to a 2D tensor. Re-shapes are normally free on
  # the GPU/CPU but may not be free on the TPU, so we want to minimize them to
  # help the optimizer.
  # 将高维张量保留最后一个维度的信息，降维至二维。
  prev_output = reshape_to_matrix(input_tensor)
  
  # 建立所有隐藏层输出的列表
  all_layer_outputs = []
  
  # 在所有hidden_layer中遍历，layer_idx表示层序号
  for layer_idx in range(num_hidden_layers):
    with tf.variable_scope("layer_%d" % layer_idx):
      # 将prev_output输入到该隐藏层中
      layer_input = prev_output
      with tf.variable_scope("attention"):
        # 建立attention_heads列表
        attention_heads = []
        with tf.variable_scope("self"):
          # 将word_embedding经过attention_layer输出为context_layer
          attention_head = attention_layer(
              from_tensor=layer_input,
              to_tensor=layer_input,
              attention_mask=attention_mask,
              num_attention_heads=num_attention_heads,
              size_per_head=attention_head_size,
              attention_probs_dropout_prob=attention_probs_dropout_prob,
              initializer_range=initializer_range,
              do_return_2d_tensor=True,
              batch_size=batch_size,
              from_seq_length=seq_length,
              to_seq_length=seq_length)
          # 将该层的attention_head附到attention_heads列表中
          attention_heads.append(attention_head)
        # 将attention_output清空
        attention_output = None
        # *每次循环都清空attention_heads，然后再append一次attention_head，长度必然为1啊？？？
        if len(attention_heads) == 1:
          # 输出attention_heads[0]
          attention_output = attention_heads[0]
        else:
          # In the case where we have other sequences, we just concatenate
          # them to the self-attention head before the projection.
          # *没明白他这里的in case如何触发
          # 似乎如果是multi-head，attention_heads.append(attention_head)会将每个head进行append，这样len(attention_heads)就会大于1，但尚未验证。
          # 对于multi-head的情况，将所有head进行concatenation。
          attention_output = tf.concat(attention_heads, axis=-1)
        # Run a linear projection of `hidden_size` then add a residual
        # with `layer_input`.
        # 将attention_output经过一个全连接层输出一个hidden_size大小的向量，
        # 再加上原始值进行normalization。
        with tf.variable_scope("output"):
          # 全连接层将attention_output（不定长，取决于head个数）map到hidden_size大小
          # 该操作仅用于mapping，没有激活函数。
          attention_output = tf.layers.dense(
              attention_output,
              hidden_size,
              kernel_initializer=create_initializer(initializer_range))
          # 对attention_output进行dropout
          attention_output = dropout(attention_output, hidden_dropout_prob)
          # 加上传入的word_embedding并进行normalization
          attention_output = layer_norm(attention_output + layer_input)
      # The activation is only applied to the "intermediate" hidden layer.
      # 将attention的输出再传入一个中间层，进一步消化，有激活函数。
      with tf.variable_scope("intermediate"):
        # 中间层
        intermediate_output = tf.layers.dense(
            attention_output,
            intermediate_size,
            activation=intermediate_act_fn,
            kernel_initializer=create_initializer(initializer_range))
      # Down-project back to `hidden_size` then add the residual.
      # 将高维的中间层输出向量map回hidden_size
      # Typically，intermediate_size = hidden_size * 4
      with tf.variable_scope("output"):
        # 全连接层将中间层输出map回hidden_size，无激活函数。
        layer_output = tf.layers.dense(
            intermediate_output,
            hidden_size,
            kernel_initializer=create_initializer(initializer_range))
        # 将该层的输出进行dropout
        layer_output = dropout(layer_output, hidden_dropout_prob)
        # 将该层的输出进行Add & Normalize
        layer_output = layer_norm(layer_output + attention_output)
        # 将prev_output赋值为该层的输出，为下一层循环做准备。
        prev_output = layer_output
        # 在all_layer_outputs附上本层的输出
        all_layer_outputs.append(layer_output)
        
  # 如果返回全部encoder层的输出
  if do_return_all_layers:
    # 建立最终输出列表
    final_outputs = []
    # 将每层的输出由2d重新调整回高维张量
    for layer_output in all_layer_outputs:
      final_output = reshape_from_matrix(layer_output, input_shape)
      # 将每层的调整后的张量逐层append到最终输出中
      final_outputs.append(final_output)
    # 返回最终的输出
    return final_outputs
  # 若不返回所有层的输出
  else:
    # 则直接将存在prev_output中的最后一层赋给最终输出
    final_output = reshape_from_matrix(prev_output, input_shape)
    # 返回最终输出
    return final_output
```
该函数用于建立模型中的Transformer部分，用到了上面建立的attention_layer函数帮助建立Transformer。
关于Transformer，具体原理可参考 [如何理解 Transformer](/posts/2020-07-03-如何理解-transformer/#1-2-Encoder部分) 。

## get_shape_list
```python
def get_shape_list(tensor, expected_rank=None, name=None):
  """Returns a list of the shape of tensor, preferring static dimensions.
  Args:
    tensor: A tf.Tensor object to find the shape of.
    expected_rank: (optional) int. The expected rank of `tensor`. If this is
      specified and the `tensor` has a different rank, and exception will be
      thrown.
    name: Optional name of the tensor for the error message.
  Returns:
    A list of dimensions of the shape of tensor. All static dimensions will
    be returned as python integers, and dynamic dimensions will be returned
    as tf.Tensor scalars.
  """
  # 若name为空
  if name is None:
    # 则将tensor的名字赋给name
    name = tensor.name
  
  # 若期待的张量维度不为空
  if expected_rank is not None:
    # 则使用assert_rank判断张量维度是否与期待一致
    assert_rank(tensor, expected_rank, name)
  
  # 获取张量的形状列表（静态）
  shape = tensor.shape.as_list()
  
  # 建立一个存储序号的列表
  non_static_indexes = []
  
  # 循环遍历shape列表
  for (index, dim) in enumerate(shape):
    # 若tensor的静态维度大小为空，
    if dim is None:
      # 则记在non_static_indexes列表中，指示第几个维度为动态维度大小。
      non_static_indexes.append(index)
  
  # 若不存在动态维度大小，
  if not non_static_indexes:
    # 则直接返回张量形状。
    return shape
  
  # 若存在动态维度大小，
  # 则使用tf.shape()获得动态形状
  dyn_shape = tf.shape(tensor)
  
  # 循环遍历non_static_indexes列表。
  for index in non_static_indexes:
    # 将对应的动态维度大小赋给形状的相应维度
    shape[index] = dyn_shape[index]
    
  # 返回张量的形状
  return shape
```
该函数用于获取张量的shape，判断其维度是否满足要求。
函数将返回一个列表描述每个维度的大小。
参考博文 [shape相关函数](https://blog.csdn.net/wc996789331/article/details/89749796) 。

## reshape_to_matrix
```python
def reshape_to_matrix(input_tensor):
  """Reshapes a >= rank 2 tensor to a rank 2 tensor (i.e., a matrix)."""
  # 维度赋值
  ndims = input_tensor.shape.ndims
  
  # 若维度小于2，
  if ndims < 2:
    # 则报错。
    raise ValueError("Input tensor must have at least rank 2. Shape = %s" %
                     (input_tensor.shape))
                     
  # 若维度等于2，
  if ndims == 2:
    # 则直接返回张量。
    return input_tensor
    
  # 若维度大于2
  
  # 获取张量中最小向量的长度，即最后一个维度的大小
  width = input_tensor.shape[-1]
  
  # 将张量转换为行矩阵。
  # 保留张量最后一个维度的信息，其他维度信息按顺序扁平化。
  # [ [ [1, 2],                      [ [1, 2],
  #     [2, 3] ],       ---\          [2, 3],
  #   [ [3, 4],         ---/          [3, 4],
  #     [4, 5] ] ]                    [4, 5] ]
  
  # [2, 2, 2]          --->         [4, 2]
  output_tensor = tf.reshape(input_tensor, [-1, width])
  
  # 返回输出张量
  return output_tensor
```
该函数用于将高维张量在保留最后一个维度信息的情况下，扁平化其他维度实现降维。

## reshape_from_matrix
```python
def reshape_from_matrix(output_tensor, orig_shape_list):
  """Reshapes a rank 2 tensor back to its original rank >= 2 tensor."""
  # 若原始shape_list的长度为2，即张量的原始维度为2，
  if len(orig_shape_list) == 2:
    # 则直接返回张量
    return output_tensor
    
  # 若原始shape_list的长度超过2
  # （小于的情况不可能，因为该函数用于将降维的张量还原）
  
  # 获取2d张量形状
  output_shape = get_shape_list(output_tensor)
  
  # 获取原始张量的[0:-1]维度的大小
  orig_dims = orig_shape_list[0:-1]
  
  # 获取2d张量的最后一维大小
  width = output_shape[-1]
  
  # 返回reshape后还原为原始的张量
  return tf.reshape(output_tensor, orig_dims + [width])
```
该函数用于将前面reshape_to_matrix(input_tensor)后降维至2d的张量还原至原始的高维形状。

## assert_rank
```python
def assert_rank(tensor, expected_rank, name=None):
  """Raises an exception if the tensor rank is not of the expected rank.
  Args:
    tensor: A tf.Tensor to check the rank of.
    expected_rank: Python integer or list of integers, expected rank.
    name: Optional name of the tensor for the error message.
  Raises:
    ValueError: If the expected shape doesn't match the actual shape.
  """
  # 若name为空，
  if name is None:
    # 则赋值为张量的name。
    name = tensor.name
    
  # 建立期望维度数的字典
  expected_rank_dict = {}
  
  # 建立{expected_rank0: True, expected_rank1: True}的字典文件
  if isinstance(expected_rank, six.integer_types):
    expected_rank_dict[expected_rank] = True
  else:
    for x in expected_rank:
      expected_rank_dict[x] = True
  
  # 获取张量的实际维度数
  actual_rank = tensor.shape.ndims
  
  # 若实际维度不在期待维度数字典中，
  if actual_rank not in expected_rank_dict:
    scope_name = tf.get_variable_scope().name
    # 则报错。
    raise ValueError(
        "For the tensor `%s` in scope `%s`, the actual rank "
        "`%d` (shape = %s) is not equal to the expected rank `%s`" %
        (name, scope_name, actual_rank, str(tensor.shape), str(expected_rank)))
```
该函数用于判断张量维度是否符合预期，不符合预期则会报错提示。

## 后记
modeling.py的官方代码给出了987行，我从2020.08.29陆陆续续看了小一个礼拜到今天2020.09.03才完成。

这段代码详细描述了BERT模型主体功能的代码实际实现，加深了我对于BERT模型、Transformer建模的理解。