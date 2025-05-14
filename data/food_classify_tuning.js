import { CONFIGS, classify } from "../js/food-classify.js";
import fs from "fs";
import path from "path";

let datasets = JSON.parse(fs.readFileSync("data/datasets.json", "utf8"));
const getDataFilePath = (version) => `data/classified_food_${version || testVersion}.txt`;

let dataset = 1;
const testVersion = "63";

runTests(CONFIGS, true, true);
// runTests([CONFIGS[4]], true, true);

async function runTests(testConfigs, generate, log) {
    if (generate) {
        console.log("Generating test data...");
        await generateTestData(testConfigs, datasets[dataset]);
    }
    let testErrors = calculatePredictionErrors(getDataFilePath());
    if (log) {
        console.log("Logging test data...");
        logFoodClassificationTest(testConfigs, testErrors);
    }
}

async function generateTestData(testConfigs, dataset) {
    for (let data of dataset) {
        const score = await classify(data.word, testConfigs);
        data.score = data.label == "food" ? score : 1 - score;
        console.log(data.word + ": " + data.score);
    }
    fs.writeFileSync(getDataFilePath(), JSON.stringify(dataset));
}

function calculatePredictionErrors(path) {
    const testData = JSON.parse(fs.readFileSync(path));
    let falsePositives = 0;
    let falseNegatives = 0;
    let correct = 0;
    console.log("===Errors in Final Result===");
    for (let data of testData) {
        const isError = data.score < 0.5;
        const actualFood = data.label === "food";

        if (isError && !actualFood) {
            console.log("false positive: " + data.word);
            falsePositives++;
        } else if (isError && actualFood) {
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
function logFoodClassificationTest(testConfigs, errors, logFile = "data/food_classification_tests.txt") {
    const entry = [
        "",
        `Test ${testVersion}`,
        ...testConfigs.map((config, i) =>
            [
                `model ${i + 1}: ${config.model.name}`,
                `  queryInput: ${config.queryInput}`,
                `  parameters: ${JSON.stringify(config.parameters)}`,
                `  threshold: ${config.threshold}`,
            ].join("\n")
        ),
        `dataset: ${dataset},`,
        `errors: ${JSON.stringify(errors)}`,
        "",
    ];

    fs.appendFileSync(path.resolve(logFile), entry.join("\n"));
}
