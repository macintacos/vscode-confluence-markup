'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { packConfluenceUri, unpackConfluenceUri, ConfluenceContentProvider } from './ConfluenceContentProvider';

const path = require('path');

function getRenderedContent(contentProvider: ConfluenceContentProvider, uri: vscode.Uri, panel: vscode.WebviewPanel) {
	contentProvider.provideTextDocumentContent(packConfluenceUri(uri)).then((renderedContent) => {
		panel.webview.html = renderedContent;
	}, (reason) => {
		vscode.window.showErrorMessage(reason);
	});
}

function createPanel(contentProvider: ConfluenceContentProvider, editor: vscode.TextEditor, viewColumn: vscode.ViewColumn) {

	let title = 'Preview ' + path.basename(editor.document.uri.fsPath);

	// Create and show panel
	const panel = vscode.window.createWebviewPanel(
		'confluencePreview',
		title,
		viewColumn,
		{
			retainContextWhenHidden: true
		}
	);
	getRenderedContent(contentProvider, editor.document.uri, panel)

	return panel;
}

function setDispose(panel: vscode.WebviewPanel, subscriptions: any){
	// Reset when the current panel is closed
        // Reset when the current panel is closed
        panel.onDidDispose(
			() => {},
			null,
			subscriptions
		  );
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const contentProvider = new ConfluenceContentProvider(context);
	const contentProviderRegistration = vscode.workspace.registerTextDocumentContentProvider(ConfluenceContentProvider.confluenceURI.scheme, contentProvider);
	let currentPanel: vscode.WebviewPanel;

	// Show confluence
	let previewDisposable = vscode.commands.registerCommand('confluence.showPreview', () => {
		let editor = vscode.window.activeTextEditor;
		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a confluence file');
			return;
		} else {
			currentPanel = createPanel(contentProvider, editor, vscode.ViewColumn.Active);
			setDispose(currentPanel, context.subscriptions);
			return currentPanel;
		}
	});

	// Show confluence to the side
	let sidePreviewDisposable = vscode.commands.registerCommand('confluence.showPreviewToSide', () => {
		let editor = vscode.window.activeTextEditor;
		if (typeof editor === 'undefined') {
			vscode.window.showErrorMessage('Please open a confluence file');
			return;
		} else {
			currentPanel = createPanel(contentProvider, editor, vscode.ViewColumn.Two);
			setDispose(currentPanel, context.subscriptions);
			return currentPanel;
		}
	});



	vscode.workspace.onDidChangeTextDocument(e => {
		let editor = vscode.window.activeTextEditor;
		if (editor) {
			if (e.document === editor.document) {
				contentProvider.update(packConfluenceUri(e.document.uri));
				getRenderedContent(contentProvider, e.document.uri, currentPanel)
			}
		}
	});

	context.subscriptions.push(contentProviderRegistration,
		previewDisposable,
		sidePreviewDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}
