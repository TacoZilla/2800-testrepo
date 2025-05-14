import dotenv from "dotenv";
dotenv.config();
const api_key = process.env.HF_API_KEY;

async function query(data) {
	const response = await fetch(
		"https://bnqjgs7r11kf8y8v.us-east-1.aws.endpoints.huggingface.cloud",
		{
			headers: { 
				"Accept" : "application/json",
				"Authorization": "Bearer hf_XXXXX",
				"Content-Type": "application/json" 
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({
    "inputs": "I like you. I love you",
    "parameters": {}
}).then((response) => {
	console.log(JSON.stringify(response));
});