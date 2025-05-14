import dotenv from "dotenv";
dotenv.config();
const api_key = process.env.HF_API_KEY;

//evaluates the success of a result from uncased Distilbert and Bart models
const scoreFunction1 = (result, threshold, label) => {
    if ((label == "food" && result.scores[0] >= threshold) || (label == "not food" && result.scores[0] < threshold)) {
        return 1;
    }
    return 0;
};

//evaluates the success of a result from fine-tuned Distilbert models
const scoreFunction2 = (result, threshold, label) => {
    result = result[0];
    if ((result.label == "food" && label == "food") || (result.label == "not food" && label == "not food")) {
        return 1;
    }
    return 0;
};

const models = {
    distilbert: {
        name: "Distilbert Uncased",
        url: "https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
        getScore: scoreFunction1,
    },
    bart: {
        name: "Bart",
        url: "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
        getScore: scoreFunction1,
    },
    distilbert_tuned_01: {
        name: "Distilbert Finetuned 1",
        url: "https://bnqjgs7r11kf8y8v.us-east-1.aws.endpoints.huggingface.cloud",
        getScore: scoreFunction2,
    },
    distilbert_tuned_02: {
        name: "Distilbert Finetuned 2",
        url: "https://el3jnvq87xefbu7g.us-east-1.aws.endpoints.huggingface.cloud",
        getScore: scoreFunction2,
    },
    distilbert_tuned_03: {
        name: "Distilbert Finetuned 3",
        url: "https://jt7cjgx3amnf5tos.us-east-1.aws.endpoints.huggingface.cloud",
        getScore: scoreFunction2,
    },
};

//define score strategies as an array, assign a strategy to each model.
export const configs = [
    // {
    //     model: models.distilbert_tuned_03,
    //     queryInput: "delicious [INPUT]",
    //     parameters: {},
    //     threshold: 0.9,
    // },
    {
        model: models.distilbert,
        queryInput: "Would you like a [INPUT]?",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
    {
        model: models.distilbert,
        queryInput: "I ate a [INPUT] for lunch today.",
        parameters: {
            candidate_labels: ["edible", "non-edible"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
    {
        model: models.bart,
        queryInput: "Some delicious [INPUT].",
        parameters: {
            candidate_labels: ["food", "not-food"],
            hypothesis_template: "The subject is {}.",
            multi_label: false,
        },
        threshold: 0.9,
    },
];

export async function query(input, config) {
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
