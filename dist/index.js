#!/usr/bin/env node
"use strict";

// src/commands/install.ts
var import_prompts2 = require("@clack/prompts");

// src/utils/prompt.ts
var import_prompts = require("@clack/prompts");
function handleCancel(value) {
  if ((0, import_prompts.isCancel)(value)) {
    (0, import_prompts.cancel)("\uC124\uCE58\uAC00 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    process.exit(0);
  }
}
function isSkipped(value) {
  return typeof value === "string" && value.trim() === "";
}

// src/skills/readme-generator/index.ts
var import_fs3 = require("fs");
var import_path3 = require("path");

// src/utils/fs.ts
var import_fs2 = require("fs");
var import_path2 = require("path");

// src/utils/config.ts
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
var CLAUDE_DIR = (0, import_path.join)((0, import_os.homedir)(), ".claude");
var CONFIG_PATH = (0, import_path.join)(CLAUDE_DIR, "config.json");
var SKILLS_DIR = (0, import_path.join)(CLAUDE_DIR, "skills");
function ensureClaudeDir() {
  if (!(0, import_fs.existsSync)(CLAUDE_DIR)) {
    (0, import_fs.mkdirSync)(CLAUDE_DIR, { recursive: true });
  }
  if (!(0, import_fs.existsSync)(SKILLS_DIR)) {
    (0, import_fs.mkdirSync)(SKILLS_DIR, { recursive: true });
  }
}
function readConfig() {
  if (!(0, import_fs.existsSync)(CONFIG_PATH)) {
    return { version: "1.0.0", skills: {} };
  }
  const raw = (0, import_fs.readFileSync)(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}
function writeConfig(config) {
  ensureClaudeDir();
  (0, import_fs.writeFileSync)(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}
function getSkillConfig(skillName) {
  const config = readConfig();
  return config.skills[skillName];
}
function setSkillConfig(skillName, skillConfig) {
  const config = readConfig();
  config.skills[skillName] = skillConfig;
  writeConfig(config);
}

// src/utils/fs.ts
function installSkillFile(skillName, filename, content) {
  ensureClaudeDir();
  const skillDir = (0, import_path2.join)(SKILLS_DIR, skillName);
  if (!(0, import_fs2.existsSync)(skillDir)) {
    (0, import_fs2.mkdirSync)(skillDir, { recursive: true });
  }
  (0, import_fs2.writeFileSync)((0, import_path2.join)(skillDir, filename), content, "utf-8");
}
function getInstalledSkills() {
  ensureClaudeDir();
  if (!(0, import_fs2.existsSync)(SKILLS_DIR)) return [];
  return (0, import_fs2.readdirSync)(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
}
function skillDirPath(skillName) {
  return (0, import_path2.join)(SKILLS_DIR, skillName);
}

// src/skills/readme-generator/index.ts
var SKILL_NAME = "readme-generator";
var SKILL_LABEL = "README \uC790\uB3D9 \uC0DD\uC131";
var SKILL_MD = (0, import_fs3.readFileSync)((0, import_path3.join)(__dirname, "skills", SKILL_NAME, "SKILL.md"), "utf-8");
function install() {
  installSkillFile(SKILL_NAME, "SKILL.md", SKILL_MD);
}
function getInstallPath() {
  return skillDirPath(SKILL_NAME);
}

// src/skills/issue-analyzer/index.ts
var import_fs5 = require("fs");
var import_path4 = require("path");
var SKILL_NAME2 = "issue-analyzer";
var SKILL_LABEL2 = "Jira \uC774\uC288 \uBD84\uC11D";
var SKILL_MD2 = (0, import_fs5.readFileSync)((0, import_path4.join)(__dirname, "skills", SKILL_NAME2, "SKILL.md"), "utf-8");
function install2(jira) {
  installSkillFile(SKILL_NAME2, "SKILL.md", SKILL_MD2);
  setSkillConfig(SKILL_NAME2, {
    jira: {
      baseUrl: jira.baseUrl,
      email: jira.email,
      apiToken: jira.apiToken,
      projectKey: jira.projectKey
    }
  });
}
function getInstallPath2() {
  return skillDirPath(SKILL_NAME2);
}

// src/utils/settings.ts
var import_fs7 = require("fs");
var import_path5 = require("path");
var SETTINGS_PATH = (0, import_path5.join)(CLAUDE_DIR, "settings.json");
var ISSUE_ANALYZER_PERMISSIONS = [
  "Bash(git log*)",
  "Bash(git blame*)",
  "Bash(git diff*)",
  "Bash(git grep*)",
  "Bash(npm test*)",
  "Bash(npm run test*)",
  "Bash(pytest*)",
  "Bash(go test*)"
];
function readSettings() {
  if (!(0, import_fs7.existsSync)(SETTINGS_PATH)) return {};
  try {
    return JSON.parse((0, import_fs7.readFileSync)(SETTINGS_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function writeSettings(settings) {
  ensureClaudeDir();
  (0, import_fs7.writeFileSync)(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}
function registerIssueAnalyzerPermissions() {
  const settings = readSettings();
  if (!settings.permissions) settings.permissions = {};
  if (!settings.permissions.allow) settings.permissions.allow = [];
  const existing = new Set(settings.permissions.allow);
  const added = [];
  for (const perm of ISSUE_ANALYZER_PERMISSIONS) {
    if (!existing.has(perm)) {
      settings.permissions.allow.push(perm);
      added.push(perm);
    }
  }
  if (added.length > 0) {
    writeSettings(settings);
  }
  return added;
}
function extractSiteName(baseUrl) {
  try {
    const hostname = new URL(baseUrl).hostname;
    return hostname.replace(".atlassian.net", "");
  } catch {
    return baseUrl;
  }
}
function registerAtlassianMcp(jira) {
  const settings = readSettings();
  const siteName = extractSiteName(jira.baseUrl);
  if (!settings.mcpServers) settings.mcpServers = {};
  settings.mcpServers["mcp-atlassian-jira"] = {
    command: "npx",
    args: ["-y", "@aashari/mcp-server-atlassian-jira"],
    env: {
      ATLASSIAN_SITE_NAME: siteName,
      ATLASSIAN_USER_EMAIL: jira.email,
      ATLASSIAN_API_TOKEN: jira.apiToken
    }
  };
  writeSettings(settings);
}

// src/commands/install.ts
async function installCommand() {
  (0, import_prompts2.intro)("chrys-tools installer \u2014 Claude Code\uC6A9 Skills \uC124\uCE58 \uB3C4\uAD6C");
  const selected = await (0, import_prompts2.multiselect)({
    message: "\uC124\uCE58\uD560 \uAE30\uB2A5\uC744 \uC120\uD0DD\uD558\uC138\uC694 (\uC2A4\uD398\uC774\uC2A4\uB85C \uC120\uD0DD/\uD574\uC81C, \uC5D4\uD130\uB85C \uD655\uC778)",
    options: [
      {
        value: "readme-generator",
        label: "README \uC790\uB3D9 \uC0DD\uC131",
        hint: "README.md \uC790\uB3D9 \uC0DD\uC131"
      },
      {
        value: "issue-analyzer",
        label: "Jira \uC774\uC288 \uBD84\uC11D",
        hint: "Jira \uD2F0\uCF13 + \uCF54\uB4DC\uBCA0\uC774\uC2A4 \uC5F0\uACB0 \uBD84\uC11D"
      }
    ],
    required: false
  });
  handleCancel(selected);
  if (!Array.isArray(selected) || selected.length === 0) {
    (0, import_prompts2.outro)("\uC120\uD0DD\uB41C \uAE30\uB2A5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC124\uCE58\uB97C \uC885\uB8CC\uD569\uB2C8\uB2E4.");
    return;
  }
  const results = [];
  if (selected.includes("readme-generator")) {
    install();
    results.push({
      label: SKILL_LABEL,
      installed: true,
      path: getInstallPath()
    });
  }
  if (selected.includes("issue-analyzer")) {
    import_prompts2.log.step("Jira \uC774\uC288 \uBD84\uC11D \uC124\uC815");
    import_prompts2.log.info("\uC774 \uAE30\uB2A5\uC740 Jira API \uC5F0\uB3D9\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
    import_prompts2.log.info("\uAC74\uB108\uB6F0\uB824\uBA74 \uC544\uBB34\uAC83\uB3C4 \uC785\uB825\uD558\uC9C0 \uC54A\uACE0 \uC5D4\uD130\uB97C \uB204\uB974\uC138\uC694.");
    const baseUrl = await (0, import_prompts2.text)({
      message: "Jira Base URL\uC744 \uC785\uB825\uD558\uC138\uC694",
      placeholder: "https://your-company.atlassian.net"
    });
    handleCancel(baseUrl);
    const email = await (0, import_prompts2.text)({
      message: "Atlassian \uACC4\uC815 \uC774\uBA54\uC77C\uC744 \uC785\uB825\uD558\uC138\uC694",
      placeholder: "you@company.com"
    });
    handleCancel(email);
    const apiToken = await (0, import_prompts2.password)({
      message: "Jira API Token\uC744 \uC785\uB825\uD558\uC138\uC694 (Atlassian \uACC4\uC815 \u2192 \uBCF4\uC548 \u2192 API \uD1A0\uD070)",
      mask: "*"
    });
    handleCancel(apiToken);
    const projectKey = await (0, import_prompts2.text)({
      message: "Jira Project Key\uB97C \uC785\uB825\uD558\uC138\uC694",
      placeholder: "ABEH",
      defaultValue: "ABEH"
    });
    handleCancel(projectKey);
    const skipped = isSkipped(baseUrl) || isSkipped(email) || isSkipped(apiToken) || isSkipped(projectKey);
    if (skipped) {
      (0, import_prompts2.note)(
        "\uAC74\uB108\uB6F4 \uD56D\uBAA9\uC774 \uC788\uC5B4 Jira \uC774\uC288 \uBD84\uC11D \uAE30\uB2A5\uC740 \uC124\uCE58\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.\n\uB098\uC911\uC5D0 npx chrys-tools add jira \uB85C \uCD94\uAC00\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        "\u23ED\uFE0F  Jira \uC774\uC288 \uBD84\uC11D \uAC74\uB108\uB700"
      );
      results.push({
        label: SKILL_LABEL2,
        installed: false,
        reason: "chrys-tools add jira\uB85C \uCD94\uAC00 \uAC00\uB2A5"
      });
    } else {
      const jiraConfig = {
        baseUrl: baseUrl.trim(),
        email: email.trim(),
        apiToken: apiToken.trim(),
        projectKey: projectKey.trim()
      };
      install2(jiraConfig);
      registerIssueAnalyzerPermissions();
      registerAtlassianMcp(jiraConfig);
      results.push({
        label: SKILL_LABEL2,
        installed: true,
        path: getInstallPath2()
      });
    }
  }
  const summaryLines = results.map(
    (r) => r.installed ? `\u2705 ${r.label.padEnd(20)} \u2192 ${r.path}` : `\u23ED\uFE0F  ${r.label.padEnd(20)} \u2192 \uAC74\uB108\uB700 (${r.reason})`
  );
  (0, import_prompts2.note)(summaryLines.join("\n"), "\uC124\uCE58 \uACB0\uACFC");
  const usageLines = [];
  if (results.some((r) => r.label === SKILL_LABEL && r.installed)) {
    usageLines.push('"\uC774 \uD504\uB85C\uC81D\uD2B8 README \uB9CC\uB4E4\uC5B4\uC918"');
    usageLines.push('"\uB9AC\uB4DC\uBBF8 \uC0DD\uC131\uD574\uC918"');
  }
  if (results.some((r) => r.label === SKILL_LABEL2 && r.installed)) {
    usageLines.push('"PROJ-1234 \uBD84\uC11D\uD574\uC918"');
    usageLines.push('"\uC774 \uC774\uC288 \uC5B4\uB514\uC11C \uB09C \uAC70\uC57C"');
  }
  if (usageLines.length > 0) {
    (0, import_prompts2.note)(usageLines.join("\n"), "\uC774\uC81C claude\uB97C \uCF1C\uACE0 \uB9D0\uD574\uBCF4\uC138\uC694");
  }
  (0, import_prompts2.outro)("\uC124\uCE58 \uC644\uB8CC! \uC5B4\uB290 \uD504\uB85C\uC81D\uD2B8\uC5D0\uC11C\uB4E0 claude\uB97C \uCF1C\uACE0 \uC0AC\uC6A9\uD558\uC138\uC694.");
}

// src/commands/add.ts
var import_prompts3 = require("@clack/prompts");
var import_fs8 = require("fs");
async function addCommand(skillArg) {
  const skill = skillArg.toLowerCase();
  if (skill === "readme" || skill === "readme-generator") {
    (0, import_prompts3.intro)(`${SKILL_LABEL} \uCD94\uAC00`);
    const targetPath = getInstallPath();
    if ((0, import_fs8.existsSync)(targetPath)) {
      import_prompts3.log.warn("\uC774\uBBF8 \uC124\uCE58\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4: " + targetPath);
    }
    install();
    (0, import_prompts3.note)(`\u2705 ${SKILL_LABEL} \u2192 ${targetPath}`, "\uC124\uCE58 \uC644\uB8CC");
    (0, import_prompts3.note)('"\uC774 \uD504\uB85C\uC81D\uD2B8 README \uB9CC\uB4E4\uC5B4\uC918"\n"\uB9AC\uB4DC\uBBF8 \uC0DD\uC131\uD574\uC918"', "\uC0AC\uC6A9 \uC608\uC2DC");
    (0, import_prompts3.outro)("\uC644\uB8CC!");
    return;
  }
  if (skill === "jira" || skill === "issue-analyzer") {
    (0, import_prompts3.intro)(`${SKILL_LABEL2} \uCD94\uAC00`);
    import_prompts3.log.info("Jira API \uC5F0\uB3D9 \uC124\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.");
    import_prompts3.log.info("\uAC74\uB108\uB6F0\uB824\uBA74 \uC544\uBB34\uAC83\uB3C4 \uC785\uB825\uD558\uC9C0 \uC54A\uACE0 \uC5D4\uD130\uB97C \uB204\uB974\uC138\uC694.");
    const baseUrl = await (0, import_prompts3.text)({
      message: "Jira Base URL\uC744 \uC785\uB825\uD558\uC138\uC694",
      placeholder: "https://your-company.atlassian.net"
    });
    handleCancel(baseUrl);
    const email = await (0, import_prompts3.text)({
      message: "Atlassian \uACC4\uC815 \uC774\uBA54\uC77C\uC744 \uC785\uB825\uD558\uC138\uC694",
      placeholder: "you@company.com"
    });
    handleCancel(email);
    const apiToken = await (0, import_prompts3.password)({
      message: "Jira API Token\uC744 \uC785\uB825\uD558\uC138\uC694 (Atlassian \uACC4\uC815 \u2192 \uBCF4\uC548 \u2192 API \uD1A0\uD070)",
      mask: "*"
    });
    handleCancel(apiToken);
    const projectKey = await (0, import_prompts3.text)({
      message: "Jira Project Key\uB97C \uC785\uB825\uD558\uC138\uC694",
      placeholder: "ABEH",
      defaultValue: "ABEH"
    });
    handleCancel(projectKey);
    const skipped = isSkipped(baseUrl) || isSkipped(email) || isSkipped(apiToken) || isSkipped(projectKey);
    if (skipped) {
      (0, import_prompts3.note)(
        "\uAC74\uB108\uB6F4 \uD56D\uBAA9\uC774 \uC788\uC5B4 \uC124\uCE58\uB97C \uC911\uB2E8\uD569\uB2C8\uB2E4.\n\uB2E4\uC2DC \uC2E4\uD589\uD558\uB824\uBA74: npx chrys-tools add jira",
        "\uC124\uCE58 \uCDE8\uC18C"
      );
      (0, import_prompts3.outro)("\uC124\uCE58\uAC00 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const jiraConfig = {
      baseUrl: baseUrl.trim(),
      email: email.trim(),
      apiToken: apiToken.trim(),
      projectKey: projectKey.trim()
    };
    install2(jiraConfig);
    registerIssueAnalyzerPermissions();
    registerAtlassianMcp(jiraConfig);
    const targetPath = getInstallPath2();
    (0, import_prompts3.note)(`\u2705 ${SKILL_LABEL2} \u2192 ${targetPath}`, "\uC124\uCE58 \uC644\uB8CC");
    (0, import_prompts3.note)('"PROJ-1234 \uBD84\uC11D\uD574\uC918"\n"\uC774 \uC774\uC288 \uC5B4\uB514\uC11C \uB09C \uAC70\uC57C"', "\uC0AC\uC6A9 \uC608\uC2DC");
    (0, import_prompts3.outro)("\uC644\uB8CC!");
    return;
  }
  console.error(`\uC54C \uC218 \uC5C6\uB294 skill: "${skillArg}"`);
  console.error("\uC0AC\uC6A9 \uAC00\uB2A5\uD55C skill: jira, readme");
  process.exit(1);
}

// src/commands/config.ts
var import_prompts4 = require("@clack/prompts");
async function configCommand(skillArg) {
  const skill = skillArg.toLowerCase();
  if (skill === "jira" || skill === "issue-analyzer") {
    (0, import_prompts4.intro)("Jira \uC774\uC288 \uBD84\uC11D \u2014 \uC124\uC815 \uBCC0\uACBD");
    const existing = getSkillConfig(SKILL_NAME2);
    if (existing?.jira) {
      import_prompts4.log.info(`\uD604\uC7AC \uC124\uC815:`);
      import_prompts4.log.info(`  Base URL   : ${existing.jira.baseUrl}`);
      import_prompts4.log.info(`  Email      : ${existing.jira.email ?? "(\uBBF8\uC124\uC815)"}`);
      import_prompts4.log.info(`  Project Key: ${existing.jira.projectKey}`);
      import_prompts4.log.info(`  API Token  : (\uC800\uC7A5\uB428)`);
    }
    import_prompts4.log.info("\uC0C8 \uAC12\uC744 \uC785\uB825\uD558\uC138\uC694. \uC5D4\uD130\uB97C \uB204\uB974\uBA74 \uAE30\uC874 \uAC12\uC744 \uC720\uC9C0\uD569\uB2C8\uB2E4.");
    const baseUrl = await (0, import_prompts4.text)({
      message: "Jira Base URL",
      placeholder: existing?.jira?.baseUrl ?? "https://your-company.atlassian.net"
    });
    handleCancel(baseUrl);
    const email = await (0, import_prompts4.text)({
      message: "Atlassian \uACC4\uC815 \uC774\uBA54\uC77C",
      placeholder: existing?.jira?.email ?? "you@company.com"
    });
    handleCancel(email);
    const apiToken = await (0, import_prompts4.password)({
      message: "Jira API Token (\uBCC0\uACBD\uD558\uC9C0 \uC54A\uC73C\uB824\uBA74 \uC5D4\uD130)",
      mask: "*"
    });
    handleCancel(apiToken);
    const projectKey = await (0, import_prompts4.text)({
      message: "Jira Project Key",
      placeholder: existing?.jira?.projectKey ?? "PROJ"
    });
    handleCancel(projectKey);
    const newBaseUrl = isSkipped(baseUrl) ? existing?.jira?.baseUrl ?? "" : baseUrl.trim();
    const newEmail = isSkipped(email) ? existing?.jira?.email ?? "" : email.trim();
    const newApiToken = isSkipped(apiToken) ? existing?.jira?.apiToken ?? "" : apiToken.trim();
    const newProjectKey = isSkipped(projectKey) ? existing?.jira?.projectKey ?? "" : projectKey.trim();
    if (!newBaseUrl || !newEmail || !newApiToken || !newProjectKey) {
      (0, import_prompts4.note)("\uD544\uC218 \uD56D\uBAA9\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uC124\uC815\uC774 \uC800\uC7A5\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.", "\uC800\uC7A5 \uC2E4\uD328");
      (0, import_prompts4.outro)("\uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
      return;
    }
    setSkillConfig(SKILL_NAME2, {
      jira: {
        baseUrl: newBaseUrl,
        email: newEmail,
        apiToken: newApiToken,
        projectKey: newProjectKey
      }
    });
    registerAtlassianMcp({ baseUrl: newBaseUrl, email: newEmail, apiToken: newApiToken });
    (0, import_prompts4.note)(
      `Base URL   : ${newBaseUrl}
Email      : ${newEmail}
Project Key: ${newProjectKey}
API Token  : (\uC800\uC7A5\uB428)`,
      "\uC124\uC815 \uC800\uC7A5 \uC644\uB8CC"
    );
    (0, import_prompts4.outro)("\uC644\uB8CC!");
    return;
  }
  console.error(`\uC124\uC815 \uAC00\uB2A5\uD55C skill: jira`);
  process.exit(1);
}

// src/commands/list.ts
var import_prompts5 = require("@clack/prompts");
var SKILL_LABEL_MAP = {
  [SKILL_NAME]: SKILL_LABEL,
  [SKILL_NAME2]: SKILL_LABEL2
};
async function listCommand() {
  const installed = getInstalledSkills();
  if (installed.length === 0) {
    import_prompts5.log.info("\uC124\uCE58\uB41C skill\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.");
    import_prompts5.log.info("\uC124\uCE58\uD558\uB824\uBA74: npx chrys-tools install");
    return;
  }
  const lines = installed.map((name) => {
    const label = SKILL_LABEL_MAP[name] ?? name;
    const config = getSkillConfig(name);
    let detail = "";
    if (name === SKILL_NAME2 && config?.jira) {
      detail = ` (${config.jira.baseUrl}, ${config.jira.projectKey})`;
    }
    return `\u2705 ${label}${detail}`;
  });
  (0, import_prompts5.note)(lines.join("\n") + `

\uC124\uCE58 \uACBD\uB85C: ${SKILLS_DIR}`, "\uC124\uCE58\uB41C Skills");
}

// src/index.ts
var args = process.argv.slice(2);
var command = args[0];
var subArg = args[1];
async function main() {
  switch (command) {
    case "install":
      await installCommand();
      break;
    case "add":
      if (!subArg) {
        console.error("Usage: chrys-tools add <skill>");
        console.error("Available: jira, readme");
        process.exit(1);
      }
      await addCommand(subArg);
      break;
    case "config":
      if (!subArg) {
        console.error("Usage: chrys-tools config <skill>");
        console.error("Available: jira");
        process.exit(1);
      }
      await configCommand(subArg);
      break;
    case "list":
      await listCommand();
      break;
    default:
      console.log("chrys-tools \u2014 Claude Code Skills \uC124\uCE58 \uB3C4\uAD6C");
      console.log("");
      console.log("Commands:");
      console.log("  chrys-tools install          \uCD5C\uCD08 \uC124\uCE58 (\uB300\uD654\uD615 \uC120\uD0DD)");
      console.log("  chrys-tools add <skill>      \uD2B9\uC815 skill \uCD94\uAC00");
      console.log("  chrys-tools config <skill>   \uC124\uCE58\uB41C skill \uC124\uC815 \uBCC0\uACBD");
      console.log("  chrys-tools list             \uC124\uCE58\uB41C skill \uBAA9\uB85D \uD655\uC778");
      console.log("");
      console.log("Available skills: jira, readme");
      break;
  }
}
main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
