import { QUERY_PARAMETERS, queryFood } from "../js/food-classify.js";
import fs from "fs";
import path from "path";

let datasets = JSON.parse(fs.readFileSync("data/datasets.json", "utf8"));
const getDataFilePath = (version) => `data/classified_food_${version || testVersion}.txt`;

let dataset = 1;
const testVersion = "57";

runTests(true, true);

async function runTests(generate = false, log = false) {
    if (generate) {
        console.log("Generating test data...");
        await generateTestData(datasets[dataset]);
    }
    let testErrors = calculatePredictionErrors(getDataFilePath());
    if (log) {
        console.log("Logging test data...");
        logFoodClassificationTest(testErrors);
    }
}

async function generateTestData(dataset) {
    for (let data of dataset) {
        const results = await queryFood(data.word);
        data.food = results.label == "food" ? results.score : 0;
        data.notFood = results.label == "not_food" ? results.score : 0;
        console.log(data.word + ": " + results.label + ": " + results.score);
    }
    fs.writeFileSync(getDataFilePath(), JSON.stringify(dataset));
}

function calculatePredictionErrors(path) {
    const testData = JSON.parse(fs.readFileSync(path));
    let falsePositives = 0;
    let falseNegatives = 0;
    let correct = 0;
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
        } else {
            correct++;
        }
    }
    const total = testData.length;
    const accuracy = (total > 0 ? (correct / total) * 100 : 0).toFixed(2) + "%";
    console.log("accuracy: ", accuracy);
    return {
        falsePositives,
        falseNegatives,
        accuracy: accuracy,
    };
}
function logFoodClassificationTest(errors, logFile = "data/food_classification_tests.txt") {
    const entry = [
        "",
        `Test ${testVersion}`,
        `model: ${QUERY_PARAMETERS.model},`,
        `dataset: ${dataset},`,
        `const QUERY_INPUT = "${QUERY_PARAMETERS.queryInput}";`,
        `const QUERY_INPUT_TEMPLATE = "${QUERY_PARAMETERS.queryInputTemplate}";`,
        `const QUERY_INPUT_LABELS = ${JSON.stringify(QUERY_PARAMETERS.queryInputLabels)};`,
        `const THRESHOLD: ${QUERY_PARAMETERS.threshold},`,
        `errors: ${JSON.stringify(errors)}`,
        `accuracy: ${errors.accuracy}`,
        "",
    ].join("\n");

    fs.appendFileSync(path.resolve(logFile), entry);
}
