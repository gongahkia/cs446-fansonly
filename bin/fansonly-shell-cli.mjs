#!/usr/bin/env node

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { createDevopsShellSession, runShellCommand } from "../lib/shell-engine.js";

const session = createDevopsShellSession();
const rl = readline.createInterface({ input, output });

output.write("FansOnly restricted access shell\n");
output.write("This is a training environment shell and does not expose the host OS.\n");

let state = await runShellCommand(session, "");

while (true) {
  const command = await rl.question(`${state.prompt} `).catch(() => "exit");
  if (command === "exit" || command === "quit") {
    break;
  }

  state = await runShellCommand(session, command);
  if (state.output) {
    output.write(`${state.output}\n`);
  }
}

rl.close();
