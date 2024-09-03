import { type Diagnostic } from "@codemirror/lint";
import type { SyntaxNode, Tree } from "@lezer/common";
import { EditorView } from "@codemirror/view";
import { TimeTypes } from "./time.js";
import { CommandDictionary } from "@nasa-jpl/aerie-ampcs";

/**
 * Linter for FPP format. Currently checks for missing time tags and for time tags
 * with complete or epoch fields.
 *
 * @param diagnostics - The list of diagnostics to append to.
 * @param _commandDictionary - A dictionary of commands, unused.
 * @param _view - The current editor view, unused.
 * @param node - The root node of the parsed tree.
 * @returns The list of diagnostics, including any new ones added by this linter.
 */
export function fPrimeLinter(
  diagnostics: Diagnostic[],
  _commandDictionary: CommandDictionary,
  _view: EditorView,
  node: SyntaxNode
): Diagnostic[] {
  const commandNodes = node.getChild("Commands")?.getChildren("Command") ?? [];

  for (const commandNode of commandNodes) {
    const timeTagNode = commandNode.getChild("TimeTag");

    if (!timeTagNode) {
      diagnostics.push({
        from: commandNode.from,
        message: "Missing 'Time Tag' for command",
        severity: "error",
        to: commandNode.to,
      });
    } else {
      const timeCompleteNode = timeTagNode?.getChild("TimeComplete");
      const timeEpochNode = timeTagNode?.getChild("TimeEpoch");

      if (timeCompleteNode || timeEpochNode) {
        const from = timeCompleteNode?.from ?? timeEpochNode?.from ?? 0;
        const to = timeCompleteNode?.to ?? timeEpochNode?.to ?? Infinity;
        diagnostics.push({
          from,
          message: "Time Complete and Time Epoch are not supported in FPP ",
          severity: "error",
          to,
        });
      }
    }
  }

  return diagnostics;
}
