const vscode = require('vscode');
const path = require('path');
const { askBlackbox } = require('./blackboxService');
const { CommentCodeLensProvider, InLineChatCodeLensProvider, SuggestionCodeLensProvider} = require('./CodeLensProvider');
const node_fetch_1 = require("node-fetch")
let isCommentInitialized = false;
let userId = ''

module.exports.initCommentAiChat = async (context, shouldInit = false)  => {
  try{
    if (context.globalState.get("userId")){
      userId = context.globalState.get("userId")
    }
  }catch(e){
    console.log('Error inline get userId')
  }
  initCodeLens(context, shouldInit);

  vscode.workspace.onDidOpenTextDocument(() => {
    if (isCommentInitialized) {
      selectionFct('open inline with plus')
      return;
    }
    
    commentControllerProvider(context);
  });

  vscode.commands.registerCommand('blackbox.comment.chat', () => commentControllerProvider(context, true));
  vscode.commands.registerCommand('blackbox.comment.add', comment => threadCommentProvider(comment, context));
};

let isLoading = true;

function initCodeLens(context, shouldInit) {
  vscode.languages.registerCodeLensProvider('*', new InLineChatCodeLensProvider());
  if (shouldInit) {
    vscode.languages.registerCodeLensProvider('*', new SuggestionCodeLensProvider());
    vscode.languages.registerCodeLensProvider('*', new CommentCodeLensProvider());
  }
  commentControllerProvider(context);
}

function commentControllerProvider(context, startThread) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  isCommentInitialized = true;

  const range = getCurrentRange(editor);

  const commentController = vscode.comments.createCommentController('blackboxComment', 'Blackbox AI Chat');
  commentController.options = {
    prompt: 'Enter your follow up question',
    placeHolder: 'Ask Blackbox any coding question',
  };

  if (isLoading) {
    commentController.options.prompt = 'Loading';
  }

  commentController.commentingRangeProvider = {
    provideCommentingRanges: (document, token) => {
      const lineCount = document.lineCount;
      return [new vscode.Range(0, 0, lineCount - 1, 0)];
    },
  };

  context.subscriptions.push(commentController);

  if (!startThread) {
    return;
  }

  const initialCommand = getInitialComment();
  const thread = commentController.createCommentThread(editor.document.uri, range, [initialCommand]);
  thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded;
}

async function threadCommentProvider(comment, context) {
  const userPrompt = comment.text;
  const thread = comment.thread;

  const userComment = {
    body: new vscode.MarkdownString(userPrompt),
    author: { name: 'You' },
    mode: vscode.CommentMode.Preview,
  };

  const loaderIconUri = vscode.Uri.file(path.join(context.extensionPath, 'out/imgs/loading-icon.svg'));
  const loadingComment = {
    body: new vscode.MarkdownString('![Loading](' + loaderIconUri.path + '|"height=50,width=50")'),
    author: { name: 'Please Wait ... ' },
    mode: vscode.CommentMode.Preview,
  };

  const currentChatHistory = thread.comments.map(comment => {
    const { body } = comment;
    const { name } = comment.author;

    const nameField = name != 'Blackbox' ? 'user' : 'blackbox';

    return { [nameField]: body };
  });

  currentChatHistory.push({ user: userPrompt });

  thread.comments = [...thread.comments, userComment, loadingComment];

  const blackboxAnswer = await askBlackbox(userPrompt, currentChatHistory, context);

  thread.comments.pop();

  const blackboxComment = {
    body: new vscode.MarkdownString(blackboxAnswer),
    author: { name: 'Blackbox AI' },
    mode: vscode.CommentMode.Preview,
  };

  currentChatHistory.push({ blackbox: blackboxAnswer });

  thread.comments = [...thread.comments, blackboxComment];
  selectionFct('inline chat request')
}

function getCurrentRange(editor) {
  const position = editor.selection.active;
  const { line, character } = position;
  const range = new vscode.Range(line, character, line, character);

  return range;
}

function getInitialComment() {
  const comment = {
    body: 'Ask some help for Blackbox AI',
    mode: 1,
    author: { name: 'Blackbox' },
  };

  return comment;
}

async function selectionFct(event) {
  try{
    const response = await (0, node_fetch_1.default)(
      "https://www.useblackbox.io/selection",
      {
        method: "POST",
        body: JSON.stringify({
          userId: userId,
          selected: event,
          source: "visual studio"
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    )
  }catch(e){
    console.log(e)
  }
}