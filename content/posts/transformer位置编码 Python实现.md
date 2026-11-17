---
title: transformer位置编码 Python实现
date: '2023-01-17 01:13:00'
category: 学习
tags:
  - NLP
  - Python
draft: false
---

# transformer位置编码 Python实现

```Python
# coding: utf-8
import torch.nn as nn
import torch
import math

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, dropout: float = 0.1, max_length: int = 20, mode: str = 'no_position'):
        """

        Args:
            d_model: int, dimension of hidden size
            dropout: float, dropout probability
            max_length: int, max sequence length of input text
            mode: str
                'add', add a trainable positional embedding to word embedding
                'add_fixed', add a fixed positional embedding to word embedding
                'add_sinusoid', add a sinusoid positional embedding to word embedding
                'multiply', do element-wise multiplication of word embedding and a trainable positional embedding
                'multiply_fixed', do element-wise multiplication of word embedding and a fixed positional embedding
                'multiply_sinusoid', do element-wise multiplication of word embedding and a sinusoid positional embedding
                'no_position', do not combine word embedding with positional information
        """

        super(PositionalEncoding, self).__init__()
        self.dropout_layer = nn.Dropout(p=dropout)
        self.position_embedding = torch.rand(1, max_length, d_model).to(device)
        self.mode = mode
        fixed_position_embedding = torch.arange(1 / max_length, 1 + 1 / max_length, 1 / max_length, requires_grad=False)
        self.fixed_position_embedding = fixed_position_embedding.unsqueeze(0).T.expand(max_length, d_model).to(device)
        position = torch.arange(max_length).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2) * (-math.log(20.0) / d_model))
        sinusoid_position_embedding = torch.zeros(max_length, 1, d_model)
        sinusoid_position_embedding[:, 0, 0::2] = torch.sin(div_term * position)
        sinusoid_position_embedding[:, 0, 1::2] = torch.cos(div_term * position)
        sinusoid_position_embedding.requires_grad = False
        sinusoid_position_embedding = sinusoid_position_embedding.permute([1, 0, 2])
        sinusoid_position_embedding = sinusoid_position_embedding.to(device)
        self.sinusoid_position_embedding = sinusoid_position_embedding

    def forward(self, word_embedding: torch.Tensor):
        """
        Args:
            word_embedding: torch.Tensor, shape [batch_size, seq_length, embedding_dim]

        Returns:
            output: torch.Tensor, shape [batch_size, seq_length, embedding_dim]
        """

        if self.mode == 'no_position':
            return word_embedding

        if self.mode == 'add':
            input_embeddings = word_embedding + self.position_embedding
        elif self.mode == 'multiply':
            input_embeddings = word_embedding * self.position_embedding
        elif self.mode == 'add_fixed':
            input_embeddings = word_embedding + self.fixed_position_embedding
        elif self.mode == 'multiply_fixed':
            input_embeddings = word_embedding * self.fixed_position_embedding
        elif self.mode == 'add_sinusoid':
            input_embeddings = word_embedding + self.sinusoid_position_embedding
        elif self.mode == 'multiply_sinusoid':
            input_embeddings = word_embedding * self.sinusoid_position_embedding
        return self.dropout_layer(input_embeddings)

def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float().to(device)
    return torch.sum(token_embeddings * input_mask_expanded, 1).to(device) / torch.clamp(input_mask_expanded.sum(1),
                                                                                         min=1e-9).to(device)

# Transformer Model
class TransformerModel(nn.Module):
    def __init__(self, vocab_size: int, d_model: int, nhead: int, num_layers: int, dropout: float = 0.1,
                 output_mode: str = 'mean') -> None:
        """
        Args:
        """
        super(TransformerModel, self).__init__()
        self.encoder = nn.Embedding(vocab_size, d_model)
        # self.embedding = nn.Embedding.from_pretrained(embedding_weights, freeze=embedding_freeze)
        self.positional_encoder = PositionalEncoding(d_model)
        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward=d_model * 4, dropout=dropout,
                                                   batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers)
        self.output_mode = output_mode

    def forward(self, input: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        word_embeddings = self.encoder(input)
        input_embeddings = self.positional_encoder(word_embeddings)
        output_embeddings = self.transformer_encoder(input_embeddings)
        if self.output_mode == 'cls':
            output_embeddings = output_embeddings[:, 0, :]
        elif self.output_mode == 'mean':
            output_embeddings = mean_pooling(output_embeddings, attention_mask)
        # output_embeddings = torch.mean(output_embeddings, 1)
        return output_embeddings
```