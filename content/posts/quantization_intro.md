+++
title = "What is quantization in modern AI ?"
date = 2024-05-23T20:31:19+02:00
draft = false
author = "Nicolas Pellerin"
math = "mathjax"
+++

![Cute llama lifting weights - courtesy of DALL-E 3](/images/cute_llama.webp)

## What is quantization ?

### First definition

---

*Quantization* refers to a broad class of algorithms. Their goal is to reduce the memory footprint of models while retaining as much performance as possible.

$$
    \text{Quantization} \ \approx \ \searrow \ \text{memory footprint of models}
$$

More precisely, this reduction in memory size will be achieved by compressing models *weights* - or *parameters* if you prefer.

---

### Case study : 70B model

Consider the new Llama 3 70B.

If you load it in 32-bit precision on your GPU [^1], it will require around (32 / 8) * 70 = 280 GB of VRAM 🥶. For regular folks with access to 1 or 2 consumer GPUs at best, this memory cost is prohibitive and the model cannot be run [^2].

This is where quantization kicks in to lower the memory required to run models.

Before we dive into data types, memory footprint calculations and specific quantization algorithms such as GPTQ, AWQ or HQQ, let's understand why quantization in particular and model compression in general have become critical in modern AI.

## Modern context

### Plus-size AI

AI models have been getting larger and larger.

Epoch AI has a nice [paper](https://epochai.org/blog/machine-learning-model-sizes-and-the-parameter-gap) exploring this trend + their [dataset](https://epochai.org/blog/compute-trends) is regularly updated. Look at the evolution of the parameter count from 1950 to 2024 :

![Evolution of model sizes over time by EpochAI](/images/epochAI_model_sizes.png)

Pay attention to the y-axis log scale. It indicates the parameter count order of magnitude - OOM. Notice how the slope is increasing.  On this figure, every vertical increment represent a gain of a full order of magnitude !

Meaning across the board,  models have been gaining orders of magnitudes more parameters and this increase in size has been accelerating

**Natural language processing** Consider the GPT series trained by OpenAI :

{{<
figure
src="/images/GPTs_timelmine_summary.png"
alt="GPTs timeline"
caption="Quick drawing I made - these GPTs sizes are well know as they were disclosed in OpenAI’s technical reports/papers/blog posts"
>}}

Gaining 3 OOMs was achieved in ~ 2 years.

{{<
figure
src="/images/gpt_series_OOMs_screen.png"
alt="GPTs sizes"
caption="Quick drawing I made"
>}}

Mid 2018, OpenAI released GPT-1 with ~100M params [^3]. Next in 2019, they progressively released the GPT-2 models. The largest GPT-2 at 1.5B params was 10x larger than GPT-1 . Next mid 2020 they announced GPT-3 - but did not release the weights this time 😢 - with an outstanding size of 175B parameters. Meaning ~100x GPT-2 size and 10x larger than any dense model at the time. Finally in March 2024 they announced GPT-4. Although this time they did not publicly disclose its architecture, it is rumored to be a 1.7T MoE so again a 10x increase in size compared to GPT-3 [^4].

And it's not just OpenAI’s GPTs. This trend can be observed across the board in the modern NLP history :  

| Year       | Model                       | Parameter Count                             |
|------------|-----------------------------|---------------------------------------------|
| 1997       | Original LSTM               | ~10k                                        |
| 2014       | [Seq2Seq LSTM](https://arxiv.org/abs/1409.3215) | ~400M                   |
| 2017       | [Original Transformer](https://arxiv.org/abs/1706.03762) | ~200M          |
| 2018       | [BERT Base - Large](https://arxiv.org/abs/1810.04805)   | 110M -  340M    |
| Early 2023 | Llama 1 series                    | 7B, 13B, 33B, 65B                     |
| Summer 2023| Llama 2 series                   | 7B, 13B, 70B                           |
| April 2024 | Llama 3 series                   | 8B, 70B, 400B (not released yet)       |

In 2024, almost all models have a parameter count in the billions ! Models having less than 10 billions parameters are often considered "small"  ! For instance, the release of llama 3 8B has been much appreciated as its size makes it relatively small in the modern context of LLMs and it has been trained a lot. Making smaller models more capable is a recent trend that seems to be gaining traction. Andrej Karpathy for one has been pushing for smaller yet capable models and the recent [Phi-3](https://arxiv.org/abs/2404.14219) model for example drives in this direction.

**Computer vision** Same thing in computer vision although the latest models are not as large as the largest LLMs. Let’s compress aggressively modern computer vision history into a couple of milestone models : LeNet —>AlexNet —> ResNets, YOLOs —> ViTs

{{<
figure
src="/images/landmark_models_cv_screen.png"
alt="Landmark models in computer vision - timeline"
caption="Timeline I made. See the increasing number of parameters :)"
>}}

In short, models sizes across the board in the AI landscape have been exploding.     And why you may ask ?

### Scaling laws

One major force that is driving this explosion is scaling laws.

I won't deep dive into this fascinating topic here - maybe in a future post :) .

If you want to get started, EpochAI literature [review](https://epochai.org/blog/scaling-laws-literature-review) looks great [^5].

On a personal note, I would recommend paper-wise reading OpenAI's 2020 publications where they study [scaling laws for GPTs performing language](https://arxiv.org/abs/2001.08361) modeling up to 1B models, and then explore how their findings [generalize to other AI tasks](https://arxiv.org/abs/2010.14701).

{{<
figure
src="/images/openAI_power_laws.png"
alt="OpenAI scaling laws - power law"
caption="Scaling laws beautifully visualized - in OpenAI’s first paper mentioned above"
>}}

Finally, the 2022 [Chinchilla paper](https://arxiv.org/abs/2203.15556) which provides more precise scaling laws than OpenAI's and estimates “compute optimal” training recipes.

And obviously you should read [Dwarkesh awesome article on scaling laws](https://www.dwarkeshpatel.com/p/will-scaling-work). Many many incredible pointers/references/ideas well-articulated and communicated in this piece written as a dialogue.

## The costs of size

Okay, models are huge. How is it a problem ?

—> Training and inference costs increase with model size.

With crazy scale comes crazy numbers

### Compute, energy, memory, etc

There are several costs to consider. Some a causally linked like computation and energy.

Costs to consider when training / running AI models :

- Memory to load models

- FLOPs to train or run inferences ~ energy, latency, throughput

- Cluster maintenance becomes a challenge ~ infrastructure, skills, time

The larger the model the more ressources are needed to both train and simply run an inference. In terms of computation, costs for a single pass of training and or a single batch of inference are roughly [^6] proportional to the model size i.e its parameter count.

Mental model on “compute” :

$$\text{compute} \sim \text{data} \times \text{params} \sim \text{params}$$

See below the consequence of larger models (and larger training datasets) on compute costs :

{{<
figure
src="/images/compute-trends.png"
alt="EpochAI compute trend figure"
caption="Compute is driven by model and dataset sizes (source : Epoch AI <3)"
>}}

The computation cost directly translates to the more fundamental energy cost. As a very concrete example laid out in the [llama 2 paper](https://arxiv.org/abs/2307.09288), the training of the Llama 2 series required  3,311,616 > 3 billions GPU hours - and it’s your A100-with-80-GB kind of GPU hours. They estimated that this amount of compute corresponds to 539 tons of CO2e emitted. The largest llama model - at 70 billions parameters - required ~1,720,000 GPU hours —> think a cluster of 6,000 A100s working full-time for 12 days.

Karpathy in his [intro talk to LLMs](https://youtu.be/zjkBMFhNj_g?si=dqVGfCspOohoCps8&t=364), these are “rookie numbers” by today’s best models standard, “off by a factor of 10 or more” …

{{<
figure
src="/images/karpathy_llama2_rookie_numbers.png"
alt="Screenshot from Karpathy's video - llama2 rookie numbers"
caption="Karpathy : these are ‘“rookie numbers”, “off by a factor of 10 or more”"
>}}

Training models at this incredible scale requires crazy infrastructures. For the llama series, meta is leveraging 2 clusters totaling 48 000 GPUs [^7]. Maintaining the good health of such clusters becomes a technical challenge as discussed [here for example](https://twitter.com/karpathy/status/1765424847705047247).

### Estimating memory requirement

As a first estimation :

$$
\text{Total mem. required} = \text{\#params} \times \text{(mem. per param)}
$$

Straightforward : to load the model, you have to load every parameters. Thus memory required is the sum of the memory required to load a single parameter.

How can we know the memory requirement of a single weight ? This is directly related to the “precision” chosen to represent this number in the computer. In scientific computing where a lot of precision is needed, real number are often represented with 64 bits. In Machine learning, it’s often 32 bits as this is already sufficient.

I will not dive into the specifics of representing numbers in the computer here. This will be the topic of the next section. But knowing how many bits are used to store a single parameter, one can easy convert this to a number of bytes - 1 bytes = 8 bits. Finally, 1 billion bytes is exactly 1 GB. Given that models are often in the billions of parameters in size, you can easily estimate the memory requirement to hold the entire model in memory (be it the disk, the RAM or a GPU memory).

## Model compression via quantization

### General idea

Model are getting larger and larger. On the one hand, larger sizes are driving AI progress. On the other hand,  larger sizes come with costs :

- Loading models requires a lot of memory

- Running/training models requires doing a ton of compute - FLOPs

- Memory and compute being fundamentally related to energy - and as a consequence money.

In order to benefit from powerful AI while diminishing the costs, one could try to compress models. The idea is would be to attack the problem at its root : model sizes.

### LLMs as an example

As Andrej Karpathy so clearly [summarizes](https://www.youtube.com/watch?v=zjkBMFhNj_g&t=1683s&ab_channel=AndrejKarpathy), LLMs are lossy compressions of their training dataset. This is true in general in AI where one can think of models as big curves fitted on a dataset - think [polynomial interpolation](https://en.wikipedia.org/wiki/Polynomial_interpolation) - François Chollet explains this all the time, [here for instance](https://twitter.com/fchollet/status/1756018992282746981). Thus data is compressed into the model through its parameters and computation graph.

Given all the general knowledge that models encapsulate - think your experience with chatGPT - you may believe that this compression is extremely precise and that tweaking a couple of parameters may throw everything off …

However this is absolutely not the case.

Among the billions of parameters, many if not most are rarely being activated and their contribution to performance - next word prediction for instance - is very negligible.

The extent to which some parameters are negligible can be quantified and one may try to simply remove these negligible weights. By removing useless parameters, models get lighter. This process is called pruning. Pruning - individual weights or even [entire layers](https://arxiv.org/abs/2403.17887) -  is one class of compression algorithm. Quantization is another one.

Quantization algorithms typically do not remove weights nor layers directly. The structure of the model stays the same. The number of parameters stays the same.

What is going to change is how much memory is used to store each weight.

### First example : naïve 32-bit —> 16-bit

The specifics of data types and how numbers are stored will be covered in the next section. For now, accept that numbers in a computer can be stored and used in computation using either :

- 32 bits = 4 bytes of memory per number

- 16 bits = 2 bytes of memory per number

Usually, AI models will have their parameters represented in the computer using the 1st method : 32-bit precision. This allow for very precise calculations as we will explore in the next section.

However, this precision may not be needed to run models. Let’s try to convert a model from 32-bit precision to 16-bit precision.

—> As we cut off memory requirement by half for each parameter, the memory requirement for the model as a whole will also be slashed in half.

``` python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

torch.manual_seed(2)

# Simple quantization algo on a "small" gpt-2 --> gpu not needed
device = "cpu" 

# load model and its tokenizer (in ram)
model_id = "gpt2"
model = AutoModelForCausalLM.from_pretrained(model_id).to(device)
tokenizer = AutoTokenizer.from_pretrained(model_id)

print("--------------------------------------")
print("What's the model size in (mega)bytes ?")

model_size_in_bytes = model.get_memory_footprint()
print(f"Model memory footprint : {model_size_in_bytes/1e6:.2f} MB")

print("---------------------------------------------------------")
print("Quantizing 32-bit --> 16-bit the first layer of the model")

# extract the first layer weights (cf Maxime Labonne's article code example)
weights = model.transformer.h[0].attn.c_attn.weight.data
# Layer size in bytes
layer_size_in_bytes = weights.element_size() * weights.nelement()

print(f"Original layer memory footprint : {layer_size_in_bytes/1e6:.2f} MB")
print(f"Original data type : {weights.dtype}")
print("Original weights: \n", weights)

# 32-bit --> 16-bit
weights_q = weights.to(torch.float16)
# Lighter layer : size cut in half ?
new_layer_size_bytes = weights_q.element_size() * weights_q.nelement()

print(f"Quantized layer memory footprint : {new_layer_size_bytes/1e6:.2f} MB")
print(f"New data type : {weights_q.dtype}")
print("New quantized weights: \n", weights)


print("---------------------------------------------")
print("Quantizing 32-bit --> 16-bit the entire model ")

# Layer by layer quantization
for layer in model.parameters():
    layer.data = layer.data.to(torch.float16)

# New model memory footprint
print("What's the quantized model size in (mega)bytes ?")
new_memory_footprint_bytes = model.get_memory_footprint()
print(f"Quantized model memory footprint : {new_memory_footprint_bytes/1e6:.2f} MB")
```  

``` terminal
--------------------------------------

What's the model size in (mega)bytes ?
Model memory footprint : 510.34 MB

---------------------------------------------------------
Quantizing 32-bit --> 16-bit the first layer of the model

Original layer memory footprint : 7.08 MB
Original data type : torch.float32
Original weights: 
 tensor([[-0.4738, -0.2614, -0.0978,  ...,  0.0513, -0.0584,  0.0250],
        [ 0.0874,  0.1473,  0.2387,  ..., -0.0525, -0.0113, -0.0156],
        [ 0.0039,  0.0695,  0.3668,  ...,  0.1143,  0.0363, -0.0318],
        ...,
        [-0.2592, -0.0164,  0.1991,  ...,  0.0095, -0.0516,  0.0319],
        [ 0.1517,  0.2170,  0.1043,  ...,  0.0293, -0.0429, -0.0475],
        [-0.4100, -0.1924, -0.2400,  ..., -0.0046,  0.0070,  0.0198]])

Quantized layer memory footprint : 3.54 MB
New data type : torch.float16
New quantized weights: 
 tensor([[-0.4738, -0.2614, -0.0978,  ...,  0.0513, -0.0584,  0.0250],
        [ 0.0874,  0.1473,  0.2387,  ..., -0.0525, -0.0113, -0.0156],
        [ 0.0039,  0.0695,  0.3668,  ...,  0.1143,  0.0363, -0.0318],
        ...,
        [-0.2592, -0.0164,  0.1991,  ...,  0.0095, -0.0516,  0.0319],
        [ 0.1517,  0.2170,  0.1043,  ...,  0.0293, -0.0429, -0.0475],
        [-0.4100, -0.1924, -0.2400,  ..., -0.0046,  0.0070,  0.0198]])

---------------------------------------------
Quantizing 32-bit --> 16-bit the entire model 

What's the quantized model size in (mega)bytes ?
Quantized model memory footprint : 261.46 MB

```  

This piece of code shows you how you can very easily download a model from the Hugging Face hub to your local machine. Then, you can leverage built-in utils from the transformers and torch librairies to look at and change the model size in bytes.

Initially, weights are stored in the computer using 32-bit precision. This code forces the weights from 32 bits to a 16 bits representation in memory. You can see that GPT-2 orignally weights in at ~500 MB. After quantization, it's at ~250 MB - half the size as anticipated.

This transition from 32-bit to 16-bit precision is analogous to truncating a number in physics to account for the significance of digits. Essentially, we are saying :

$$\pi \simeq 3.141592654 \simeq 3.1415$$

for every parameters of the model. More or less truncating the “precision” by half [^8]. See how you don’t even notice the change in precision with the prints ! But still, precision has been diminished.

How is the performance affected ? Let’s try to benchmark this with :

- Qualitative evaluation with a simple inference on a given prompt

- Quantitative measurement of “next token prediction” with the model perplexity on a given dataset

[^1]: N-bit precision and memory footprint calculation will be explained later in the post. Basically, each parameter requires 32 bits / 8 bits per byte = 4 bytes of memory. Thus 70 billions of such parameters amount to 70B * 4 bytes = 280 GB of memory.

[^2]: Considering a “simple” run where on tries to load the entire model in a single GPU at once. However there are many tactics to run larger model on a GPU than one would expect given the amount of VRAM available (for instance off-loading some layers onto the RAM or even the disk to alleviate the memory pressure on the GPU)

[^3]: "117M" ? Given gpt2 x10 gpt1, must be ~100M

[^4]: Big caveat here as we are not comparing apples to apples. GPT-1, 2 and 3 are  'dense'  as opposed to the 'sparse' MoE architecture   that GPT-4 is believed to be. Same  kind of architecture than the popular Mixtrals for instance, where only a subset of all the weights are active in a given inference round.

[^5]: I have not read it thoroughly. I just discovered it while writing this post. But as always with EpochAI work it looks great.

[^6]: The specifics depends on your training/inference strategy.

[^7]: 2 clusters of 24 000 GPU. See llama 3 introduction post  (section “Scaling up pretraining”).

[^8]: How the precision is affected depends on how you use your 32 or 16 bits. More on that in the data type section.
