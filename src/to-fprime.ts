import { type Diagnostic } from "@codemirror/lint";
import type { SyntaxNode, Tree } from "@lezer/common";
import { EditorView } from "@codemirror/view";
import {
  CommandDictionary,
  FswCommandArgumentRepeat,
} from "@nasa-jpl/aerie-ampcs";
import {
  getBalancedDuration,
  getDurationTimeComponents,
  parseDurationString,
  TimeTypes,
  validateTime,
} from "./time.js";

export const TOKEN_REPEAT_ARG = "RepeatArg";
export const TOKEN_ERROR = "⚠";

/**
 * Converts a SeqN sequence into an FPrime sequence.
 * @param {Tree} node The parsed SeqN syntax tree.
 * @param {string} sequence The original SeqN sequence string.
 * @param {CommandDictionary | null} commandDict The dictionary of commands (if any).
 * @param {string} sequenceName The name of the sequence (used for error messages).
 * @returns {Promise<string>} The converted FPrime sequence.
 */
export async function convertSequenceToFprime(
  node: Tree,
  sequence: string,
  commandDictionary: CommandDictionary | null,
  _sequenceName: string
): Promise<string> {
  const baseNode = node.topNode;
  const fprimeSeq: string[] = [];

  let child = baseNode.getChild("Commands")?.firstChild;
  while (child) {
    const step = parseStep(child, sequence, commandDictionary);
    if (step) {
      fprimeSeq.push(step);
    }
    child = child?.nextSibling;
  }

  return fprimeSeq.join("\n");
}

function parseStep(
  child: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null
): string | null {
  switch (child.name) {
    case "Command":
      return parseCommand(child, text, commandDictionary);
    case "LineComment":
      return `;${parseDescription(child ?? child, text)}`;
    default:
      return null;
  }
  // Standalone comment nodes (not descriptions of steps), are not supported in the seq.json schema
  // Until a schema change is coordinated, comments will dropped while writing out seq.json.
  // Requests are parsed outside this block since they are not allowed to be nested.
  return null;
}

function parseCommand(
  commandNode: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null
): string {
  const time = parseTime(commandNode, text)?.trim() || "UNKNOWN";

  const stemNode = commandNode.getChild("Stem");
  const stem = stemNode ? text.slice(stemNode.from, stemNode.to) : "UNKNOWN";

  const argsNode = commandNode.getChild("Args");
  const args = argsNode
    ? parseArgs(argsNode, text, commandDictionary, stem)
    : "";

  const description = parseDescription(
    commandNode.getChild("LineComment"),
    text
  );

  return `${time} ${stem.replace("_", ".")} ${args}${description ? ` ;${description}` : ""}`;
}

function parseDescription(
  descriptionNode: SyntaxNode | null,
  text: string
): string | null {
  if (!descriptionNode) {
    return null;
  }
  // +1 offset to drop '#' prefix
  const description = text.slice(descriptionNode.from + 1, descriptionNode.to);
  return removeEscapedQuotes(description);
}

export function removeEscapedQuotes(text: string | number | boolean): string {
  if (typeof text === "string") {
    return text.replace(/\\"|"(?!\\")/g, '"').trim();
  }
  return text.toString();
}

function parseArgs(
  argsNode: SyntaxNode,
  text: string,
  commandDictionary: CommandDictionary | null,
  stem: string
): string {
  const args: string[] = [];
  let argNode = argsNode.firstChild;
  const dictArguments = commandDictionary?.fswCommandMap[stem]?.arguments ?? [];
  let i = 0;

  while (argNode) {
    const dictArg = dictArguments[i] ?? null;
    if (argNode.name === TOKEN_REPEAT_ARG) {
      const arg = parseRepeatArgs(
        argNode,
        text,
        (dictArg as FswCommandArgumentRepeat) ?? null
      );
      if (arg) {
        args.push(arg);
      } else {
        console.log(
          `Could not parse repeat arg for node with name ${argNode.name}`
        );
      }
    } else {
      const arg = parseArg(argNode, text);
      if (arg) {
        args.push(arg);
      } else {
        console.log(`Could not parse arg for node with name ${argNode.name}`);
      }
    }
    argNode = argNode?.nextSibling;
    ++i;
  }

  return args.join(",");
}

function parseRepeatArgs(
  repeatArgsNode: SyntaxNode,
  text: string,
  dictRepeatArgument: FswCommandArgumentRepeat | null
) {
  const repeatArg = [];
  const repeatArgs = dictRepeatArgument?.repeat?.arguments;
  const repeatArgsLength = repeatArgs?.length ?? Infinity;
  let repeatArgNode: SyntaxNode | null = repeatArgsNode;

  if (repeatArgNode) {
    let args: string[] = [];
    let argNode = repeatArgNode.firstChild;

    let i = 0;
    while (argNode) {
      if (i % repeatArgsLength === 0) {
        // [[1 2] [3 4]] in seq.json is flattened in seqN [1 2 3 4]
        // dictionary definition is required to disambiguate
        args = [];
        repeatArg.push(args);
      }
      const arg = parseArg(argNode, text, repeatArgs);
      if (arg) {
        args.push(arg);
      } else {
        console.log(`Could not parse arg for node with name ${argNode.name}`);
      }

      argNode = argNode.nextSibling;
      i++;
    }

    repeatArgNode = repeatArgNode.nextSibling;
  }

  return `[${repeatArg.map((arg) => arg.join(",")).join(",")}]`;
}

function parseArg(node: SyntaxNode, text: string, dictArg?: object): string {
  if (node.name === TOKEN_REPEAT_ARG) {
    return parseRepeatArgs(
      node,
      text,
      (dictArg as FswCommandArgumentRepeat) ?? null
    );
  }
  return text.slice(node.from, node.to);
}

function parseTime(commandNode: SyntaxNode, text: string): string | undefined {
  const timeTagNode = commandNode.getChild("TimeTag");
  let tag = "UNKNOWN";

  if (timeTagNode == null) {
    return undefined;
  }

  const timeTagAbsoluteNode = timeTagNode.getChild("TimeAbsolute");
  const timeTagRelativeNode = timeTagNode.getChild("TimeRelative");
  if (!timeTagAbsoluteNode && !timeTagRelativeNode) {
    return undefined;
  }

  if (timeTagAbsoluteNode) {
    return `A${text
      .slice(timeTagAbsoluteNode.from + 1, timeTagAbsoluteNode.to)
      .trim()}`;
  } else if (timeTagRelativeNode) {
    const timeTagRelativeText = text
      .slice(timeTagRelativeNode.from + 1, timeTagRelativeNode.to)
      .trim();

    // a regex to determine if this string ####T##:##:##.###
    if (validateTime(timeTagRelativeText, TimeTypes.RELATIVE)) {
      const { isNegative, days, hours, minutes, seconds, milliseconds } =
        getDurationTimeComponents(
          parseDurationString(timeTagRelativeText, "seconds")
        );
      tag = `R${isNegative}${days}${days ? "T" : ""}${hours}:${minutes}:${seconds}${milliseconds}`;
      return tag;
    }

    if (validateTime(timeTagRelativeText, TimeTypes.RELATIVE_SIMPLE)) {
      tag = getBalancedDuration(timeTagRelativeText);
      if (parseDurationString(tag).milliseconds === 0) {
        tag = `R${tag.slice(0, -4)}`;
      }
      return tag;
    }
  }
}

export function getFromAndTo(nodes: (SyntaxNode | null)[]): {
  from: number;
  to: number;
} {
  return nodes.reduce(
    (acc, node) => {
      if (node === null) {
        return acc;
      }
      return {
        from: Math.min(acc.from, node.from),
        to: Math.max(acc.to, node.to),
      };
    },
    { from: Number.MAX_VALUE, to: Number.MIN_VALUE }
  );
}
