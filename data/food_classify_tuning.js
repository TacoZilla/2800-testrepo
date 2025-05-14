import { QUERY_PARAMETERS, queryFood } from "../js/food-classify.js";
import fs from "fs";
import path from "path";

let datasets = JSON.parse(fs.readFileSync("data/datasets.json", "utf8"));
let dataset = 0;
const getDataFilePath = (version) => `data/classified_food_${version || testVersion}.txt`;

const testVersion = "46";

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

async function generateTestData(dataset) {
    for (let data of dataset) {
        const score = await queryFood(data.word);
        data.food = score[0];
        data.notFood = score[1];
        console.log(data.word + ": food:" + data.food);
    }

    fs.writeFileSync(getDataFilePath(), JSON.stringify(dataset));
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
    console.log("counting errors. Current threshold: " + QUERY_PARAMETERS.threshold);
    for (let data of testData) {
        // Predict as food if score > THRESHOLD
        const predictedFood = data.food > QUERY_PARAMETERS.threshold;
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

function logFoodClassificationTest(accuracy, errors, logFile = "data/food_classification_tests.txt") {
    const entry = [
        "",
        `Test ${testVersion}`,
        `model: ${QUERY_PARAMETERS.model},`,
        `dataset: ${dataset},`,
        `const QUERY_INPUT = "${QUERY_PARAMETERS.queryInput}";`,
        `const QUERY_INPUT_TEMPLATE = "${QUERY_PARAMETERS.queryInputTemplate}";`,
        `const QUERY_INPUT_LABELS = ${JSON.stringify(QUERY_PARAMETERS.queryInputLabels)};`,
        `const THRESHOLD: ${QUERY_PARAMETERS.threshold},`,
        `test accuracy: ${accuracy}`,
        `errors: ${JSON.stringify(errors)}`,
        "",
    ].join("\n");

    fs.appendFileSync(path.resolve(logFile), entry);
}
