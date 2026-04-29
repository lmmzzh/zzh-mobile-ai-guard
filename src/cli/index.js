import { runInit } from "../core/config.js";
import { runStart } from "../core/baseline.js";
import { runCheck } from "../core/check.js";
import { showReport } from "../core/report.js";
import { showStatus } from "../core/status.js";

const HELP_TEXT = `zzh-mobile-ai-guard

Daily command: zmg

Usage:
  zmg init      Set up guard files for the current project
  zmg start     Record project state before AI changes code
  zmg check     Check risk after AI changes code

Advanced:
  zmg report    Show the latest report path
  zmg status    Show current guard state

Install once:
  npm install -g zzh-mobile-ai-guard

First run:
  zmg init
  zmg start
  zmg check`;

export function runCli(args, cwd) {
  const command = args[0] ?? "--help";

  try {
    switch (command) {
      case "init":
        runInit(cwd);
        break;
      case "start":
      case "baseline":
        runStart(cwd);
        break;
      case "check":
        runCheck(cwd);
        break;
      case "report":
        showReport(cwd);
        break;
      case "status":
        showStatus(cwd);
        break;
      case "-h":
      case "--help":
      case "help":
        console.log(HELP_TEXT);
        break;
      case "-v":
      case "--version":
        console.log("0.1.0");
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error("");
        console.error(HELP_TEXT);
        process.exitCode = 2;
    }
  } catch (error) {
    console.error("");
    console.error("zzh-mobile-ai-guard 运行失败");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}
