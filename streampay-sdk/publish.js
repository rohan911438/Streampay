#!/usr/bin/env node

/**
 * StreamPay SDK - npm Publishing Script
 * Automated build and publish to npm
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  log("", "cyan");
  log("============================================================", "cyan");
  log(`     ${title}`, "cyan");
  log("============================================================", "cyan");
  log("", "cyan");
}

function success(message) {
  log(`✓ ${message}`, "green");
}

function error(message) {
  log(`✗ ${message}`, "red");
}

function warning(message) {
  log(`⚠ ${message}`, "yellow");
}

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
}

async function runCommand(command, showOutput = true) {
  try {
    const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
    if (showOutput) {
      console.log(output);
    }
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  try {
    header("StreamPay SDK - npm Publishing Helper");

    // Check npm installation
    log("Checking npm installation...", "yellow");
    const npmCheck = runCommand("npm -v", false);
    if (!npmCheck.success) {
      error("npm is not installed!");
      log("Please install Node.js from https://nodejs.org/", "red");
      process.exit(1);
    }
    success(`npm version: ${npmCheck.output.trim()}`);

    // Check npm login
    log("", "cyan");
    log("Checking npm authentication...", "yellow");
    const loginCheck = runCommand("npm whoami", false);

    let npmUser;
    if (!loginCheck.success) {
      warning("You are NOT logged in to npm.");
      log("", "cyan");
      log("Opening npm login...", "yellow");
      log("", "cyan");

      // Run npm login interactively
      await new Promise((resolve) => {
        const login = spawn("npm", ["login"], {
          stdio: "inherit",
        });

        login.on("close", (code) => {
          resolve(code);
        });
      });

      const secondCheck = runCommand("npm whoami", false);
      if (!secondCheck.success) {
        error("Login failed!");
        process.exit(1);
      }
      npmUser = secondCheck.output.trim();
    } else {
      npmUser = loginCheck.output.trim();
    }

    success(`Logged in as: ${npmUser}`);

    // Navigate to SDK directory
    const sdkDir = __dirname;
    process.chdir(sdkDir);

    // Verify package.json exists
    if (!fs.existsSync("package.json")) {
      error("package.json not found!");
      log("This script must be run from the SDK root directory", "red");
      process.exit(1);
    }

    // Get version
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    log(`Current version: ${pkg.version}`, "cyan");

    // Build SDK
    log("", "cyan");
    log("Building SDK...", "yellow");
    log("============================================================", "cyan");
    const buildResult = runCommand("npm run build");
    if (!buildResult.success) {
      error("Build failed!");
      process.exit(1);
    }
    success("Build successful");

    // Type check
    log("", "cyan");
    log("Type checking...", "yellow");
    const typeResult = runCommand("npm run typecheck");
    if (!typeResult.success) {
      error("Type check failed!");
      process.exit(1);
    }
    success("Type check successful");

    // Preview files to be published
    log("", "cyan");
    log("============================================================", "cyan");
    log("Preview of files to be published:", "cyan");
    log("============================================================", "cyan");
    log("", "cyan");
    runCommand("npm pack --dry-run");

    // Ask for confirmation
    log("", "cyan");
    log("============================================================", "cyan");
    const confirm = await question("Ready to publish to npm? (yes/no): ");

    if (confirm.toLowerCase() !== "yes") {
      warning("Publishing cancelled.");
      process.exit(0);
    }

    // Publish to npm
    log("", "cyan");
    log("Publishing to npm...", "yellow");
    log("============================================================", "cyan");
    const publishResult = runCommand("npm publish --access public");

    if (!publishResult.success) {
      error("Publishing failed!");
      process.exit(1);
    }

    // Success!
    log("", "cyan");
    log("============================================================", "green");
    log("✓ SUCCESS! Package published to npm", "green");
    log("============================================================", "green");
    log("", "cyan");
    log("Your package is now available at:", "cyan");
    log("https://www.npmjs.com/package/streampay-sdk", "green");
    log("", "cyan");
    log("You can install it with:", "cyan");
    log("npm install streampay-sdk", "green");
    log("", "cyan");

    process.exit(0);
  } catch (err) {
    error(`An error occurred: ${err.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
