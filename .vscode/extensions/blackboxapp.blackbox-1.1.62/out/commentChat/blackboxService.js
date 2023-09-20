const node_fetch_1 = require('node-fetch');

module.exports.askBlackbox = async (userPrompt, currentChatHistory, context) => {
  const userId = context.globalState.get('userId');

  const requestBody = {
    userId,
    textInput: userPrompt,
    allMessages: currentChatHistory,
    source: 'visual studio',
    clickedContinue: false,
    stream: '',
  };
  const response = await (0, node_fetch_1.default)('https://useblackbox.io/chat-request-v4', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  return result['response'][0][0];
};
