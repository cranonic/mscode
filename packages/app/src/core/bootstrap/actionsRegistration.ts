// src/core/bootstrap/actionsRegistration.ts
//
// Thin re-export — implementation lives in ./actions/*
// Existing imports of bootstrapAction from this file keep working.

export { bootstrapAction } from './actions';
export { getActiveMonacoEditor, triggerOnActiveEditor } from './actions';
