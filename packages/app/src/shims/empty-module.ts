/** Empty module for deep monaco-editor/esm/* imports under shim alias. */
export const StandaloneServices = { get: () => ({ documentSymbolProvider: { ordered: () => [] } }) };
export const ILanguageFeaturesService = {};
export const CancellationToken = { None: {} };
export default {};
