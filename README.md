# FPrime-Sequence-Adaptation

Aerie Sequence Adaptation Plugin for Phoenix Editor:

Features:

- Extend Time validation, FPP sequences doesn't support command_complete (C), epoch_time (R), or ground_epoch_time (G) time tags
- Export SeqN to FPP sequences and import FPP sequences to SeqN.
- TODO: Implement autocomplete (Not supported by the adaptation hook)

To build use node 20

```
npm i
npm run build
```

Upload the `dist/adaptation.js` to Aerie
