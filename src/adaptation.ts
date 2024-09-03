import type { SyntaxNode, Tree } from "@lezer/common";

import { fPrimeAutoComplete } from "./autocomplete.js";
import { fPrimeLinter } from "./linter.js";
import { convertSequenceToFprime } from "./to-fprime.js";
import { convertFPrimeToSequence } from "./from-fprime.js";
import { CommandDictionary } from "@nasa-jpl/aerie-ampcs";
import { EditorView } from "codemirror";

import { type Diagnostic } from "@codemirror/lint";

(() => {
  return {
    inputFormat: {
      // autoComplete: fPrimeAutoComplete, // TODO: not supported by Aerie-UI yet
      name: "SeqN Overrides",
      toInputFormat: convertFPrimeToSequence,
      linter: fPrimeLinter,
    },
    outputFormat: [
      {
        name: "FPP Output",
        toOutputFormat: convertSequenceToFprime,
        linter: function outputLinter(
          diagnostics: Diagnostic[],
          commandDictionary: CommandDictionary,
          view: EditorView,
          node: SyntaxNode
        ): Diagnostic[] {
          return [];
        },
      },
    ],
  };
})();
