# Airline Manager 4 Bot

An automation bot for **Airline Manager 4**, built with **Playwright + TypeScript**. It automates routine airline operations such as logging in, buying fuel and CO2, running marketing campaigns, scheduling maintenance, and departing aircraft.

> Important: the in-game language must be set to **English** because the Playwright selectors rely on English UI labels.

## Table of Contents

- [Features](#features)
- [Execution Flow](#execution-flow)
- [Human-Like and Anti-Freeze Behavior](#human-like-and-anti-freeze-behavior)
- [Environment Variables](#environment-variables)
- [Running with GitHub Actions](#running-with-github-actions)
- [Recommended Scheduling with cron-job.org](#recommended-scheduling-with-cron-joborg)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [Important Notes](#important-notes)

## Features

### 1. Automatic Login

The bot opens Airline Manager 4, opens the login modal, and fills credentials from environment variables:

- `EMAIL`
- `PASSWORD`

The email and password are typed character-by-character with randomized delays to avoid robotic instant input.

### 2. Automatic Fuel Purchase

The bot checks the current fuel price, remaining tank capacity, current holding amount, and account balance before purchasing.

Fuel features:

- Buys fuel when the price per 1,000 liters is below `MAX_FUEL_PRICE`.
- Fills available empty capacity when the account balance is sufficient.
- Calculates an affordable amount when the account balance is not enough for a full tank.
- Performs an emergency fuel buy when the current holding is below `2,000,000` and the price is below `1250`.
- Skips buying when the tank is already full or the computed purchase amount is zero.

### 3. Automatic CO2 Purchase

The bot checks the current CO2 price, remaining capacity, and current holding amount.

CO2 features:

- Buys CO2 when the price is below `MAX_CO2_PRICE`.
- Fills all remaining CO2 capacity when the price matches the configured threshold.
- Performs an emergency CO2 buy of `1,000,000` when the current holding is below `1,000,000` and the price is below `180`.
- Skips buying when the CO2 tank is already full.

### 4. Automatic Marketing Campaigns

The bot opens the campaign panel and starts useful campaigns when they are not already active.

Campaign features:

- Starts an **Eco-friendly** campaign if it is not active.
- Optionally starts an **Increase airline reputation** campaign when `INCREASE_AIRLINE_REPUTATION=true`.
- Supports selecting the reputation campaign type through `CAMPAIGN_TYPE`.
- Supports selecting campaign duration through `CAMPAIGN_DURATION`.
- Uses human-like dropdown selection with mouse movement and visual delay.

### 5. Automatic Maintenance and A-Checks

The bot opens the maintenance planning panel and handles bulk checks and repairs.

Maintenance features:

- Opens the **Plan** panel.
- Runs **Bulk check** for aircraft that have dangerous/warning indicators.
- Scrolls to aircraft cards when they are outside the visible viewport.
- Scrolls back to the top before submitting when scrolling was needed.
- Runs **Bulk repair** with the repair threshold set to `30%`.
- Skips repair submission when no aircraft match the repair condition.

### 6. Depart All Aircraft

The bot opens the routes/depart menu and presses **Depart All** while the button is available.

Depart features:

- Tries to depart aircraft up to `8` times.
- Waits for the route API response when available.
- Stops when the game reports that some aircraft cannot depart.
- Closes the route panel after the depart process finishes.

### 7. Randomized Operation Order

To make the flow less repetitive, the bot randomizes the first two modules:

- Fuel and CO2
- Maintenance and repair

After those modules, it always runs:

1. Marketing campaign
2. Depart all aircraft

This ensures the campaign is active before the aircraft depart.

### 8. Monthly Repository Keepalive

On the 1st day of the month in UTC, the test writes `last-commit.txt` once for that month. The GitHub Actions workflow can then auto-commit that file to keep the repository active.

## Execution Flow

The main Playwright test runs this flow:

1. Check whether the monthly keepalive log needs to be written.
2. Initialize utility modules.
3. Log in to Airline Manager 4.
4. Run fuel/CO2 and maintenance in a randomized order.
5. Run marketing campaigns.
6. Depart all aircraft.
7. Wait briefly and close the page.

## Human-Like and Anti-Freeze Behavior

This project includes interaction patterns that make the automation less rigid and more resilient against UI lag.

Human-like behavior:

- Curved mouse movement with small micro-noise.
- Random click positions inside a safe area of each element instead of always clicking the exact center.
- Randomized mouse down/up duration.
- Random delays between actions using `GeneralUtils.randomSleep(min, max)`.
- Sequential typing with per-character delay.
- Dropdown selection with an opening click, visual delay, and then `selectOption`.
- More natural maintenance scrolling instead of perfectly linear scrolling.

Anti-freeze behavior:

- Validates that the fuel, maintenance, and campaign panels actually load after opening.
- If a panel fails to open, the bot briefly opens a different menu as a UI refresh/poke action.
- Main modules are retried before being treated as failed.
- Blank-space clicks near the top of the screen are used to close overlays or panels before moving to another module.

## Environment Variables

Create a `.env` file for local runs, or configure GitHub Actions secrets/variables for workflow runs.

### Required

| Name | Type | Description |
| --- | --- | --- |
| `EMAIL` | Secret | Airline Manager 4 account email. |
| `PASSWORD` | Secret | Airline Manager 4 account password. |
| `MAX_FUEL_PRICE` | Variable | Normal fuel purchase price limit. Example: `550`. |
| `MAX_CO2_PRICE` | Variable | Normal CO2 purchase price limit. Example: `120`. |

### Optional

| Name | Type | Default/Example | Description |
| --- | --- | --- | --- |
| `INCREASE_AIRLINE_REPUTATION` | Variable | `false` | Set to `true` to enable reputation campaigns. |
| `CAMPAIGN_TYPE` | Variable | `1` | Reputation campaign type to purchase. |
| `CAMPAIGN_DURATION` | Variable | `4` | Campaign duration. The code converts this into the dropdown option. |
| `PAKSI_VIDEO` | Variable/workflow input | `false` | When `true`, Playwright keeps screenshots and videos for every run. |

Example local `.env`:

```env
EMAIL=your-email@example.com
PASSWORD=your-password
MAX_FUEL_PRICE=550
MAX_CO2_PRICE=120
INCREASE_AIRLINE_REPUTATION=true
CAMPAIGN_TYPE=1
CAMPAIGN_DURATION=4
```

## Running with GitHub Actions

The main workflow is located at `.github/workflows/playwright.yml` and is currently configured for **manual runs** through `workflow_dispatch`.

Setup steps:

1. Fork this repository.
2. Open **Settings → Secrets and variables → Actions**.
3. Add these secrets:
   - `EMAIL`
   - `PASSWORD`
4. Add these variables:
   - `MAX_FUEL_PRICE`
   - `MAX_CO2_PRICE`
   - `INCREASE_AIRLINE_REPUTATION` if you want reputation campaigns
   - `CAMPAIGN_TYPE` if reputation campaigns are enabled
   - `CAMPAIGN_DURATION` if reputation campaigns are enabled
5. Open the **Actions** tab.
6. Run the **Playwright Tests** workflow manually.

Manual workflow inputs:

- `aktifkan_random_delay`: enables a randomized delay before the bot starts.
- `paksa_simpan_video`: forces Playwright to keep screenshots/videos for review.

The workflow also:

- Uses Node.js `22`.
- Installs dependencies with `npm ci`.
- Caches Playwright browsers.
- Installs Playwright Chromium.
- Creates `.env` from GitHub secrets and variables.
- Runs `npx playwright test`.
- Uploads Playwright test artifacts.
- Auto-commits `last-commit.txt` if the monthly keepalive logic changed it.

## Recommended Scheduling with cron-job.org

For more reliable timing, this bot is usually more optimal when triggered by **cron-job.org** instead of relying only on GitHub Actions scheduled workflows.

Why cron-job.org is recommended:

- GitHub Actions cron schedules can be delayed when GitHub runners are busy.
- Scheduled workflows may be disabled automatically on inactive public repositories.
- cron-job.org can call the workflow dispatch endpoint at the exact interval you choose.
- You can remove the `schedule` block from the workflow and let cron-job.org be the external scheduler.

> The current active workflow uses manual `workflow_dispatch`. To let cron-job.org start it automatically, you need to call the GitHub Actions workflow dispatch API.

### 1. Create a GitHub Personal Access Token

Create a fine-grained or classic GitHub token that can trigger workflows for this repository.

Minimum required permission:

- Repository access to this bot repository.
- Actions/workflows permission that allows `workflow_dispatch`.

Keep the token private. Do not commit it into the repository.

### 2. Find Your Workflow Dispatch URL

Use this API endpoint format:

```text
https://api.github.com/repos/OWNER/REPO/actions/workflows/playwright.yml/dispatches
```

Replace:

- `OWNER` with your GitHub username or organization.
- `REPO` with your repository name.

Example:

```text
https://api.github.com/repos/your-username/Airline-Manager-4-Bot/actions/workflows/playwright.yml/dispatches
```

### 3. Configure cron-job.org

In cron-job.org, create a new cronjob with these settings:

| Setting | Value |
| --- | --- |
| Title | `Airline Manager 4 Bot` |
| URL | Your workflow dispatch URL |
| Request method | `POST` |
| Schedule | Example: every 30 minutes, or your preferred interval |
| Timezone | Choose your preferred timezone |
| Timeout | Use a reasonable timeout such as `30` seconds |
| Save responses | Optional, useful for debugging |

### 4. Add HTTP Headers

Add these request headers:

```text
Accept: application/vnd.github+json
Authorization: Bearer YOUR_GITHUB_TOKEN
X-GitHub-Api-Version: 2022-11-28
Content-Type: application/json
User-Agent: cron-job.org-airline-manager-bot
```

Replace `YOUR_GITHUB_TOKEN` with your real token.

### 5. Add Request Body

Use this JSON request body:

```json
{
  "ref": "main",
  "inputs": {
    "aktifkan_random_delay": "true",
    "paksa_simpan_video": "false"
  }
}
```

If your default branch is not `main`, replace `main` with your actual branch name.

### 6. Suggested Intervals

Recommended schedules:

- Every `30` minutes for active accounts.
- Every `60` minutes for lighter usage.
- Avoid very short intervals because the workflow itself can take several minutes and GitHub has usage limits.

If you previously used a GitHub Actions `schedule` cron, remove or disable it to avoid duplicate runs. Keep `workflow_dispatch` enabled because cron-job.org uses it to trigger the workflow.

## Running Locally

Install dependencies:

```bash
npm ci
```

Install Playwright browsers:

```bash
npx playwright install --with-deps chromium
```

Create `.env` using the example above, then run:

```bash
npx playwright test
```

To open the Playwright HTML report:

```bash
npx playwright show-report
```

## Project Structure

```text
.
├── .github/workflows/
│   ├── playwright.yml       # Main GitHub Actions workflow
│   └── playwright.dudu      # Archived/example scheduled workflow
├── tests/
│   └── airlineManager.spec.ts
├── utils/
│   ├── campaign.utils.ts
│   ├── fleet.utils.ts
│   ├── fuel.utils.ts
│   ├── general.utils.ts
│   └── maintenance.utils.ts
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

Important files:

- `tests/airlineManager.spec.ts`: orchestrates the full bot flow.
- `utils/general.utils.ts`: login, sleep helpers, mouse movement, and global human-like click helpers.
- `utils/fuel.utils.ts`: fuel and CO2 purchase logic.
- `utils/campaign.utils.ts`: eco-friendly and airline reputation campaign logic.
- `utils/maintenance.utils.ts`: bulk check and bulk repair logic.
- `utils/fleet.utils.ts`: depart all aircraft logic.
- `playwright.config.ts`: browser, screenshot, video, trace, and reporter configuration.

## Important Notes

- The game language must be **English**.
- This bot interacts with the web UI, so Airline Manager 4 UI changes may require selector updates.
- GitHub Actions timing can be delayed by runner availability.
- For the most consistent schedule, use cron-job.org to trigger the workflow dispatch endpoint.
- If you want a private setup, clone or fork this project into a private repository.
- Do not commit `.env`; it is already ignored by `.gitignore`.
- Use this bot at your own risk. Human-like and anti-freeze behavior can make interactions more natural, but it cannot guarantee 100% safety from detection systems.
- For questions, contact Email: `elssword4587@gmail.com`.

## License

This project uses the license available in the `LICENSE` file.
