import dotenv from "dotenv";
dotenv.config();
const api_key = process.env.HF_API_KEY;

const MODELS = {
    distilbert: {
        name: "Distilbert Uncased",
        url: "https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
    },
    bart: {
        name: "Bart",
        url: "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
    },
};
export const CONFIGS = [
    {
        model: MODELS.distilbert,
        queryInput: "I enjoyed a [INPUT] for breakfast today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
    {
        model: MODELS.distilbert,
        queryInput: "I ate a [INPUT] for lunch today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
    {
        model: MODELS.distilbert,
        queryInput: "I'd like a [INPUT] for lunch today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
    {
        model: MODELS.distilbert,
        queryInput: "I had a [INPUT] for dinner today!",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
    {
        model: MODELS.bart,
        queryInput: "Some delicious [INPUT].",
        parameters: {
            candidate_labels: ["food", "not-food"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
];

export async function classify(input, configs = CONFIGS) {
    let score = 0;
    for (let config of configs) {
        const response = await query(input, config);
        if (response.result.scores[0] > config.threshold) {
            score++;
        }
    }
    score /= configs.length;
    return score;
}

async function query(input, config) {
    const payload = {
        inputs: config.queryInput.replace("[INPUT]", input),
        parameters: config.parameters,
    };
    const response = await fetch(config.model.url, {
        headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(payload),
    });
    const result = await response.json();
    return { result, config };
}
