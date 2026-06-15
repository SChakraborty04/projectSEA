const { Anthropic } = require('@anthropic-ai/sdk');
const client = new Anthropic({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: 'empty',
});
console.log(client.buildRequest({ path: '/messages', method: 'post' }).url);
console.log(client.buildRequest({ path: '/v1/messages', method: 'post' }).url);
