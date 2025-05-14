import dotenv from "dotenv";
dotenv.config();
const api_key = process.env.HF_API_KEY;

const models = {
    distilbert: "https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
    bart: "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
    distilbert_tuned: "https://bnqjgs7r11kf8y8v.us-east-1.aws.endpoints.huggingface.cloud"
};

export const QUERY_PARAMETERS = {
    model: models.distilbert_tuned,
    dataset: 0,
    queryInput: "I ate a [INPUT] for lunch today.",
    queryInputTemplate: "The subject is {}.",
    queryInputLabels: ["edible", "non-edible"],
    threshold: 0.9,
};

export async function isFood(input) {
    const result = await queryFood(input);
    console.log(input + ": " + results[0]);
    return result[0] > QUERY_PARAMETERS.threshold;
}

//returns a floating point number (0-1) representing how strongly the input is classified as "food"
export async function queryFood(input) {
    console.log("Querying food classification for input:", input);
    const payload = {
        inputs: QUERY_PARAMETERS.queryInput.replace("[INPUT]", input),
        parameters: {
            candidate_labels: QUERY_PARAMETERS.queryInputLabels,
            hypothesis_template: QUERY_PARAMETERS.queryInputTemplate,
            multi_label: false,
        },
    };
    console.log("Payload sent to model:", payload);
    const result = await query(payload);
    console.log("Raw result from model:", result);
    return result.scores;
}

//code from https://huggingface.co/
async function query(data) {
    const response = await fetch(QUERY_PARAMETERS.model, {
        headers: {
            Authorization: `Bearer ${api_key}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
    });
    const result = await response.json();
    return result;
}
