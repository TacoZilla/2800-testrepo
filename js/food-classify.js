import dotenv from "dotenv";
dotenv.config();
const api_key = process.env.HF_API_KEY;

const models = {
    distilbert: "https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
    bart: "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
    distilbert_tuned_01: "https://bnqjgs7r11kf8y8v.us-east-1.aws.endpoints.huggingface.cloud",
    distilbert_tuned_02: "https://el3jnvq87xefbu7g.us-east-1.aws.endpoints.huggingface.cloud",
    distilbert_tuned_03: "https://jt7cjgx3amnf5tos.us-east-1.aws.endpoints.huggingface.cloud",
};

export const QUERY_PARAMETERS = {
    model: models.distilbert_tuned_03,
    queryInput: "delicious [INPUT]",
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
    const payload = {
        inputs: QUERY_PARAMETERS.queryInput.replace("[INPUT]", input),
        parameters: {},
    };
    const result = await query(payload);
    return result[0];
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
