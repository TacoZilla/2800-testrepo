const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv").config();
const api_key = process.env.HF_API_KEY;

const models = {
    distilbert: "https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
    bart: "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli",
};

let datasets = JSON.parse(fs.readFileSync("data/datasets.json", "utf8"));

const testVersion = "38";
const model = models.distilbert;
const dataset = 0;
const QUERY_INPUT = "I ate a [INPUT] for lunch today.";
const QUERY_INPUT_TEMPLATE = "The subject is {}.";
const QUERY_INPUT_LABELS = ["edible", "non-edible"];
const THRESHOLD = 0.9;

const getDataFilePath = (version) => `data/classified_food_${version || testVersion}.txt`;

runTests(true, true);

async function runTests(generate = false, log = false) {
    if (generate) {
        console.log("Generating test data...");
        await generateTestData(datasets[dataset]);
    }
    let testAccuracy = calculateTestAccuracy(getDataFilePath());
    let testErrors = calculatePredictionErrors(getDataFilePath());
    if (log) {
        console.log("Logging test data...");
        logFoodClassificationTest(testAccuracy, testErrors);
    }
}

//code from https://huggingface.co/
async function query(data) {
    const response = await fetch(model, {
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

//returns a floating point number (0-1) representing how strongly the input is classified as "food"
async function queryFood(input) {
    const result = await query({
        inputs: QUERY_INPUT.replace("[INPUT]", input),
        parameters: {
            candidate_labels: QUERY_INPUT_LABELS,
            hypothesis_template: QUERY_INPUT_TEMPLATE,
            multi_label: false,
        },
    });
    return result.scores;
}

function logFoodClassificationTest(accuracy, errors, logFile = "data/food_classification_tests.txt") {
    const entry = [
        "",
        `Test ${testVersion}`,
        `model: ${Object.keys(models).find((key) => models[key] === model)},`,
        `dataset: ${dataset},`,
        `const QUERY_INPUT = "${QUERY_INPUT}";`,
        `const QUERY_INPUT_TEMPLATE = "${QUERY_INPUT_TEMPLATE}";`,
        `const QUERY_INPUT_LABELS = ${JSON.stringify(QUERY_INPUT_LABELS)};`,
        `const THRESHOLD: ${THRESHOLD},`,
        `test accuracy: ${accuracy}`,
        `errors: ${JSON.stringify(errors)}`,
        "",
    ].join("\n");

    fs.appendFileSync(path.resolve(logFile), entry);
}

function calculateTestAccuracy(path) {
    const testData = JSON.parse(fs.readFileSync(path));
    let score = 0;
    for (let data of testData) {
        if (data.label === "food") {
            score += data.food; // higher is better
        } else {
            score += 1 - data.food; // lower is better
        }
    }
    score /= testData.length;
    console.log("test accuracy: " + score);
    return score; // closer to 1 is better overall
}

function calculatePredictionErrors(path) {
    const testData = JSON.parse(fs.readFileSync(path));
    let falsePositives = 0;
    let falseNegatives = 0;
    console.log("counting errors. Current threshold: " + THRESHOLD);
    for (let data of testData) {
        // Predict as food if score > THRESHOLD
        const predictedFood = data.food > THRESHOLD;
        const actualFood = data.label === "food";

        if (predictedFood && !actualFood) {
            console.log("false positive: " + data.word);
            falsePositives++;
        } else if (!predictedFood && actualFood) {
            console.log("false negative: " + data.word);
            falseNegatives++;
        }
    }
    return {
        falsePositives,
        falseNegatives,
    };
}

async function generateTestData(dataset) {
    for (let data of dataset) {
        const score = await queryFood(data.word);
        data.food = score[0];
        data.notFood = score[1];
        console.log(data.word + ": food:" + data.food);
    }

    fs.writeFileSync(getDataFilePath(), JSON.stringify(dataset));
}
