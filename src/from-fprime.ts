/**
 * Converts an FPP sequence in FPrime syntax to a SeqN sequence format.
 * @param fPrimeString The FPrime sequence to convert.
 * @returns The converted SeqN sequence.
 */
export async function convertFPrimeToSequence(
  fPrimeString: string
): Promise<string> {
  // loop line by line
  const lines = fPrimeString.split("\n");
  const seqNLines: string[] = [];
  for (const line of lines) {
    const lineBeforeComment = line.split(";")[0];
    const lineAfterComment = line.replace(lineBeforeComment, "");
    seqNLines.push(
      `${lineBeforeComment.replaceAll(",", " ").replace(/\.(?=[a-zA-Z])/g, "_")}${lineAfterComment.length > 0 ? `#${lineAfterComment.replace(";", "")}` : ""}`
    );
  }
  return seqNLines.join("\n");
}
