import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

//Is the word "apple" a type of food or drink? Your replies must be only a single word: ["yes", "no"].
dotenv.config();
const api_key = process.env.HF_API_KEY;

const client = new InferenceClient(api_key);

export const threshold = 0.95;

const MODELS = {
    distilbert: {
        name: "Distilbert Uncased",
        url: "https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
        getPayload: (config, input) => {
            return {
                inputs: config.queryInput.replace("[INPUT]", input),
                parameters: config.parameters,
            };
        },
        getScore: (response) => {
            if (response && response.result && Array.isArray(response.result.scores)) {
                return response.result.scores[0];
            }
            return 0;
        },
    },
    distilbertTuned: {
        name: "Distilbert Food",
        url: "https://router.huggingface.co/hf-inference/models/mrdbourke/learn_hf_food_not_food_text_classifier-distilbert-base-uncased",
        getPayload: (config, input) => {
            return { inputs: config.queryInput.replace("[INPUT]", input) };
        },
        getScore: (response) => {
            if (response && response.result && Array.isArray(response.result.scores)) {
                return response.result[0].find((obj) => obj.label === "food")?.score ?? 0;
            }
            return 0;
        },
    },
    bart: {
        name: "Bart",
        url: "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
    },
    deepseekV2: {
        name: "Deepseek V2",
        provider: "novita",
        model: "deepseek-ai/DeepSeek-Prover-V2-671B",
    },
    deepseekR1: {
        name: "Deepseek R1",
        provider: "novita",
        model: "deepseek-ai/DeepSeek-R1",
    },
    deepseekV3: {
        name: "Deepseek V3",
        provider: "together",
        model: "deepseek-ai/DeepSeek-V3",
    },
    deepseek7B: {
        name: "Deepseek R1 Distill Qwen 7B",
        provider: "nscale",
        model: "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
    },
};
export const DISTILBERT_CONFIGS = [
        {
        model: MODELS.distilbert,
        queryInput: "I enjoyed a [INPUT] for breakfast today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
    },
    {
        model: MODELS.distilbert,
        queryInput: "I'd like a [INPUT] for lunch today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
    },
    {
        model: MODELS.distilbert,
        queryInput: "I'm going to eat some [INPUT] for lunch today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
    },
    {
        model: MODELS.distilbert,
        queryInput: "I had a [INPUT] for dinner today!",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
    },
    {
        model: MODELS.distilbert,
        queryInput: "I ate some [INPUT] for dinner today",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
    },
    // {
    //     model: MODELS.distilbertTuned,
    //     queryInput: "I'd like a [INPUT] for lunch today.",
    // },
    // {
    //     model: MODELS.distilbertTuned,
    //     queryInput: "I had a [INPUT] for dinner today!",
    // },
];

export const DEEPSEEK_CONFIGS = [
    {
        model: MODELS.deepseek7B,
        message: `Is the word "[INPUT]" a type of food or drink? 
                Your replies must be only a single word: ["yes", "no"].`,
    },
];

export async function classify(input) {
    const promises = DISTILBERT_CONFIGS.map(config => queryDistilbert(input, config));
    const responses = await Promise.all(promises);
    let score = 0;
    for (let response of responses) {
        const responseScore = response.config.model.getScore(response);
            score+= responseScore;
    }
    score /= DISTILBERT_CONFIGS.length;
    const isFood = score >= threshold;
    return { score, isFood};
}

async function queryDistilbert(input, config) {
    const response = await fetch(config.model.url, {
        headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(config.model.getPayload(config, input)),
    });
    const result = await response.json();
    return { result, config };
}

export async function classifyDeepseek(input) {
    const start = Date.now();
    let score = 0;
    for (let config of DEEPSEEK_CONFIGS) {
        const response = await queryDeepseek(input, config);
        console.log("raw response: " + (response.toLowerCase().trim()));
        if (response.includes("yes")) {
            console.log("it is food")
            score++;
        }
        else if (response.includes("no")) {
            console.log(`${input} is not food`)
        }
        else{
            console.log("bad response: " + response)
        }
    }
    score /= configs.length;
    const end = Date.now();
    console.log(`Query took ${end - start} ms`);
    return score;
}

async function queryDeepseek(input, config) {
    const response = await client.chatCompletion({
        provider: config.model.provider,
        model: config.model.model,
        messages: [
            {
                role: "user",
                content: config.message.replace("[INPUT]", input),
            },
        ],
    });
    return response.choices[0].message.content;
}
