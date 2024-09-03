import type { SyntaxNode } from "@lezer/common";
import type {
  Completion,
  CompletionContext,
  CompletionResult,
} from "@codemirror/autocomplete";
import { CommandDictionary } from "@nasa-jpl/aerie-ampcs";
import { getDoyTime } from "./time.js";

type CursorInfo = {
  isAtLineComment: boolean;
  isAtSymbolBefore: boolean;
  isTimeTagBefore: boolean;
  position: number;
};

export function fPrimeAutoComplete(
  context: CompletionContext,
  node: SyntaxNode,
  commandDictionary: CommandDictionary
): CompletionResult | null {
  return null;
}
