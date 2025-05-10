const dotenv = require('dotenv').config();
const api_key = process.env.HF_API_KEY;

//code from https://huggingface.co/typeform/distilbert-base-uncased-mnli?inference_api=true&inference_provider=hf-inference&language=js
async function query(data) {
    const response = await fetch(
		"https://router.huggingface.co/hf-inference/models/typeform/distilbert-base-uncased-mnli",
        {
            headers: {
				Authorization: `Bearer ${api_key}`,
                "Content-Type": "application/json",
         },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
}

query({
    inputs: "raw baby",
    parameters: { candidate_labels: ["food", "not food"] }
}).then((response) => {
    console.log(JSON.stringify(response));
});