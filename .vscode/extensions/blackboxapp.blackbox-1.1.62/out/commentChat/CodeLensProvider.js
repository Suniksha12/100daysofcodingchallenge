const vscode = require('vscode');

module.exports.InLineChatCodeLensProvider = class InLineChatCodeLensProvider {
  _onDidChangeCodeLenses = new vscode.EventEmitter();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  async provideCodeLenses(document, token) {
    const codeLenses = [];
    const lastLine = document.lineCount;
    const startPosition = new vscode.Position(0, 0);
    const endPosition = new vscode.Position(lastLine, 0);

    const range = new vscode.Range(startPosition, endPosition);

    codeLenses.push(
      new vscode.CodeLens(range, {
        title: '',
        tooltip: 'Blackbox Inline',
        command: 'blackbox.comment.chat',
      })
    );
    return codeLenses;
  }

  fire() {
    this._onDidChangeCodeLenses.fire();
  }
};

module.exports.SuggestionCodeLensProvider = class SuggestionCodeLensProvider {
  _onDidChangeCodeLenses = new vscode.EventEmitter();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  async provideCodeLenses(document, token) {
    const codeLenses = [];
    const MIN_RANGE = 5;

    const text = document.getText();
    const lines = text.split('\n');

    const ranges = [];
    let startRange = 0;
    lines.forEach((line, index) => {
      if (!line.trim()) {
        if (index - startRange >= MIN_RANGE) {
          ranges.push(new vscode.Range(new vscode.Position(startRange, 0), new vscode.Position(index, 0)));
          startRange = index;
        }
      }
    });

    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const p = new vscode.Position(range.end.line, 0);
      const nr = new vscode.Range(p, p);
      const selection = new vscode.Selection(range.start, range.end);
      const start = i - 5 < 0 ? 0 : i - 5;
      const end = i;

      const previousRange = end < 0 ? [] : ranges.slice(start, end);
      codeLenses.push(
        new vscode.CodeLens(nr, {
          title: 'Code Suggestions',
          tooltip: 'Blackbox Code Suggestion',
          command: 'blackbox.comment.add.suggestion',
          // arguments: [{ name: 'blackbox.comment.chat', selection }],
          arguments: [{ range, previousRange }],
        })
      );
    }
    return codeLenses;
  }

  fire() {
    this._onDidChangeCodeLenses.fire();
  }
};


module.exports.CommentCodeLensProvider = class CommentCodeLensProvider {
  _onDidChangeCodeLenses = new vscode.EventEmitter();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  async provideCodeLenses(document, token) {
    const codeLenses = [];

    const allSymbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
    const symbols = allSymbols?.filter(symbol => symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Class || symbol.kind === vscode.SymbolKind.Method || symbol.kind === vscode.SymbolKind.Constructor);

    for (let i = 0; i < symbols.length; i++) {
      const range = symbols[i].location.range;

      codeLenses.push(
        new vscode.CodeLens(range, {
          title: 'Comment Code',
          tooltip: 'Blackbox Comment Code',
          command: 'blackbox.comment.code',
          arguments: [{ range }],
        })
      );
    }
    return codeLenses;
  }

  fire() {
    this._onDidChangeCodeLenses.fire();
  }
};

module.exports.SuggestionCodeLensProviderBySymbols = class SuggestionCodeLensProviderBySymbols {
  _onDidChangeCodeLenses = new vscode.EventEmitter();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  async provideCodeLenses(document, token) {
    const codeLenses = [];

    const allSymbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
    const symbols = allSymbols?.filter(symbol => symbol.kind === vscode.SymbolKind.Function || symbol.kind === vscode.SymbolKind.Class || symbol.kind === vscode.SymbolKind.Method || symbol.kind === vscode.SymbolKind.Constructor);

    for (let i = 0; i < symbols.length; i++) {
      const range = symbols[i].location.range;
      const p = new vscode.Position(range.end.line + 1, 0);
      const nr = new vscode.Range(p, p);
      const selection = new vscode.Selection(range.start, range.end);
      const start = i - 5 < 0 ? 0 : i - 5;
      const end = i;

      const previousRange = end < 0 ? [] : ranges.slice(start, end);
      codeLenses.push(
        new vscode.CodeLens(nr, {
          title: 'Code Suggestions',
          tooltip: 'Blackbox Code Suggestion',
          command: 'blackbox.comment.add.suggestion',
          // arguments: [{ name: 'blackbox.comment.chat', selection }],
          arguments: [{ range, previousRange }],
        })
      );
    }
    return codeLenses;
  }

  fire() {
    this._onDidChangeCodeLenses.fire();
  }
};