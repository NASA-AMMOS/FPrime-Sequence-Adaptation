import { describe, it } from "node:test";
import assert from "assert";
import { convertFPrimeToSequence } from "../src/from-fprime.js";

describe("convertFPrimeToSequence", () => {
  it("should return empty string for empty input", async () => {
    const result = await convertFPrimeToSequence("");
    assert.equal(result, "");
  });

  it("should return original string with no conversions needed", async () => {
    const result = await convertFPrimeToSequence("R1 fsw_cmd");
    assert.equal(result, "R1 fsw_cmd");
  });

  it("should convert semicolon to hash", async () => {
    const result = await convertFPrimeToSequence("R1 fsw_cmd ;comment");
    assert.equal(result, "R1 fsw_cmd #comment");
  });

  it("should convert comma to space", async () => {
    const result = await convertFPrimeToSequence(
      "R1 fsw_cmd 1,2,[10,[blue,red]] #comment"
    );
    assert.equal(result, "R1 fsw_cmd 1 2 [10 [blue red]] #comment");
  });

  it("should convert dot to underscore", async () => {
    const result = await convertFPrimeToSequence(
      "A2024-001T00:10:30.001 demo.fsw_cmd 1 2 [10 [blue red]] #comment"
    );
    assert.equal(
      result,
      "A2024-001T00:10:30.001 demo_fsw_cmd 1 2 [10 [blue red]] #comment"
    );
  });

  it("should perform multiple conversions", async () => {
    const result =
      await convertFPrimeToSequence(`;--------------------------------------------------------------------
; Simple sequence file
; Note: that anything after a ';' is a comment
;--------------------------------------------------------------------

; Commands in a sequence can either be timed absolutely or relative
; to the execution of the previous command. Here is an absolute NOOP
; command.
A2015-075T22:32:40.123 cmdDisp.CMD_NO_OP

; Here is a relative NOOP command, which will be run 1 second after
; the execution of the previous command
R00:00:01 cmdDisp.CMD_NO_OP; Send a no op command

; This command will run immediately after the previously executed command
; has completed
R00:00:00 cmdDisp.CMD_NO_OP

; Let's try out some commands with arguments
R01:00:01.150 cmdDisp.CMD_NO_OP_STRING "Awesome string!";  <- cool argument right?
R03:51:01.000 cmdDisp.CMD_TEST_CMD_1 17,3.2,2; <- this command has 3 arguments
R00:05:00 eventLogger.ALOG_SET_EVENT_REPORT_FILTER INPUT_COMMAND,INPUT_DISABLED; <- this command uses enum arguments`);
    assert.equal(
      result,
      `#--------------------------------------------------------------------
# Simple sequence file
# Note: that anything after a ';' is a comment
#--------------------------------------------------------------------

# Commands in a sequence can either be timed absolutely or relative
# to the execution of the previous command. Here is an absolute NOOP
# command.
A2015-075T22:32:40.123 cmdDisp_CMD_NO_OP

# Here is a relative NOOP command, which will be run 1 second after
# the execution of the previous command
R00:00:01 cmdDisp_CMD_NO_OP# Send a no op command

# This command will run immediately after the previously executed command
# has completed
R00:00:00 cmdDisp_CMD_NO_OP

# Let's try out some commands with arguments
R01:00:01.150 cmdDisp_CMD_NO_OP_STRING "Awesome string!"#  <- cool argument right?
R03:51:01.000 cmdDisp_CMD_TEST_CMD_1 17 3.2 2# <- this command has 3 arguments
R00:05:00 eventLogger_ALOG_SET_EVENT_REPORT_FILTER INPUT_COMMAND INPUT_DISABLED# <- this command uses enum arguments`
    );
  });
});
