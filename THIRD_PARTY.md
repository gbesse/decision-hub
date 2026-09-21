# Reused source

Purpose: Preserve exact provenance for the dependency-free Worker contract.

- `dist/server/decisionpack-validation.js` copies `src/validation.mjs` from [gbesse/decisionpacks, commit 3c90b6e667c16653b9a6ae00b376df9bddbd8461](https://github.com/gbesse/decisionpacks/tree/3c90b6e667c16653b9a6ae00b376df9bddbd8461), MIT. Only the filename changes; validation and finite-rule matching remain the same.
- `dist/server/example-pack.js` contains the support-triage example from [Decision Workbench, commit 161f55c637cbcb666b67449b0bbbbee52c393684](https://github.com/gbesse/decision-workbench/tree/161f55c637cbcb666b67449b0bbbbee52c393684), MIT.

The Worker fingerprint and decision-record assembly use Web Crypto and preserve the DecisionPacks field contract; they do not introduce Node runtime dependencies. This is a platform deployment adaptation, not a new model SDK.
