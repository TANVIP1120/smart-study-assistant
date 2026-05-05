"""
Smart Study Assistant
=====================
A command-line tool that helps users prioritise study/work tasks using
a rule-based scoring system based on deadline, difficulty, and importance.

Priority formula: (importance * 3) + (difficulty * 2) + (10 - deadline)
"""

import json
import os

# ── Constants ────────────────────────────────────────────────────────────────

SAVE_FILE = "tasks.json"

# ANSI colour codes (work on most modern terminals)
RESET  = "\033[0m"
BOLD   = "\033[1m"
RED    = "\033[91m"
YELLOW = "\033[93m"
GREEN  = "\033[92m"
CYAN   = "\033[96m"
WHITE  = "\033[97m"
DIM    = "\033[2m"

# ── Colour helpers ────────────────────────────────────────────────────────────

def colour(text: str, code: str) -> str:
    return f"{code}{text}{RESET}"

def priority_colour(score: int) -> str:
    """Return ANSI code based on urgency tier."""
    if score >= 35:
        return RED        # High priority
    elif score >= 20:
        return YELLOW     # Medium priority
    else:
        return GREEN      # Low priority

def priority_label(score: int) -> str:
    if score >= 35:
        return colour("[HIGH]  ", RED)
    elif score >= 20:
        return colour("[MED]   ", YELLOW)
    else:
        return colour("[LOW]   ", GREEN)

# ── Core logic ────────────────────────────────────────────────────────────────

def calculate_priority(task: dict) -> int:
    """
    Rule-based priority score.
    Weights: importance x3 (most critical factor),
             difficulty x2 (harder tasks need earlier attention),
             urgency = (10 - deadline) so closer deadlines score higher.
    """
    urgency = 10 - task["deadline"]
    return (task["importance"] * 3) + (task["difficulty"] * 2) + urgency


def recalculate_all(tasks: list) -> None:
    """Refresh priority scores for every task in-place."""
    for task in tasks:
        task["priority"] = calculate_priority(task)


def sorted_tasks(tasks: list) -> list:
    """Return tasks sorted by priority descending (original list unchanged)."""
    return sorted(tasks, key=lambda t: t["priority"], reverse=True)

# ── File persistence ──────────────────────────────────────────────────────────

def save_tasks(tasks: list) -> None:
    try:
        with open(SAVE_FILE, "w") as f:
            json.dump(tasks, f, indent=2)
    except OSError as e:
        print(colour(f"  Warning: could not save tasks ({e})", YELLOW))


def load_tasks() -> list:
    if not os.path.exists(SAVE_FILE):
        return []
    try:
        with open(SAVE_FILE, "r") as f:
            tasks = json.load(f)
        recalculate_all(tasks)   # recalculate in case formula changed
        return tasks
    except (OSError, json.JSONDecodeError):
        print(colour("  Warning: could not load saved tasks. Starting fresh.", YELLOW))
        return []

# ── Input helpers ─────────────────────────────────────────────────────────────

def get_int(prompt: str, lo: int, hi: int) -> int:
    """Keep asking until the user enters an integer in [lo, hi]."""
    while True:
        raw = input(prompt).strip()
        if raw.lstrip("-").isdigit():
            value = int(raw)
            if lo <= value <= hi:
                return value
        print(colour(f"  Please enter a whole number between {lo} and {hi}.", YELLOW))


def get_str(prompt: str) -> str:
    """Keep asking until the user enters a non-empty string."""
    while True:
        raw = input(prompt).strip()
        if raw:
            return raw
        print(colour("  Name cannot be empty.", YELLOW))

# ── Feature functions ─────────────────────────────────────────────────────────

def add_task(tasks: list) -> None:
    """Prompt the user for task details, calculate priority, append to list."""
    print(colour("\n── Add New Task ──────────────────────────────", CYAN))

    name = get_str("  Task name       : ")

    # Check for duplicate names (case-insensitive)
    if any(t["name"].lower() == name.lower() for t in tasks):
        print(colour(f"  A task named '{name}' already exists.", YELLOW))
        choice = input("  Add anyway? (y/n): ").strip().lower()
        if choice != "y":
            return

    deadline   = get_int("  Deadline (days)  : 1–30 : ", 1, 30)
    difficulty = get_int("  Difficulty       : 1–10 : ", 1, 10)
    importance = get_int("  Importance       : 1–10 : ", 1, 10)

    task = {
        "name":       name,
        "deadline":   deadline,
        "difficulty": difficulty,
        "importance": importance,
        "priority":   0,
        "completed":  False,
    }
    task["priority"] = calculate_priority(task)
    tasks.append(task)
    save_tasks(tasks)

    score = task["priority"]
    print(colour(f"\n  ✓ '{name}' added  |  Priority score: {score}", GREEN))


def view_tasks(tasks: list, show_completed: bool = False) -> None:
    """Print all tasks sorted by priority, with colour-coded urgency labels."""
    visible = [t for t in tasks if show_completed or not t["completed"]]

    if not visible:
        msg = "  No tasks to show." if not show_completed else "  No completed tasks."
        print(colour(msg, DIM))
        return

    print(colour("\n── Task List (sorted by priority) ───────────", CYAN))
    print(colour(
        f"  {'#':<4}{'Label':<10}{'Score':<7}{'Name':<25}"
        f"{'Deadline':>10}{'Difficulty':>11}{'Importance':>11}",
        BOLD
    ))
    print(colour("  " + "─" * 76, DIM))

    for i, task in enumerate(sorted_tasks(visible), start=1):
        label  = priority_label(task["priority"])
        score  = colour(str(task["priority"]), priority_colour(task["priority"]))
        status = colour(" ✓", GREEN) if task["completed"] else ""
        name   = task["name"] + status
        print(
            f"  {i:<4}{label:<10}{score:<7}"
            f"{name:<25}"
            f"{task['deadline']:>10} days"
            f"{task['difficulty']:>10}/10"
            f"{task['importance']:>10}/10"
        )

    print(colour("  " + "─" * 76, DIM))
    print(colour(
        "  Colour key:  "
        + colour("HIGH ≥35", RED) + "   "
        + colour("MED 20–34", YELLOW) + "   "
        + colour("LOW <20", GREEN),
        DIM
    ))


def delete_task(tasks: list) -> None:
    """Remove a task by name or displayed index number."""
    active = [t for t in tasks if not t["completed"]]
    if not active:
        print(colour("  No active tasks to delete.", DIM))
        return

    view_tasks(tasks)
    print(colour("\n── Delete Task ───────────────────────────────", CYAN))
    raw = input("  Enter task name or number: ").strip()

    target = None

    # Try numeric index first
    if raw.isdigit():
        idx = int(raw) - 1
        ordered = sorted_tasks(active)
        if 0 <= idx < len(ordered):
            target = ordered[idx]
        else:
            print(colour("  Invalid number.", YELLOW))
            return
    else:
        # Case-insensitive name match
        matches = [t for t in tasks if t["name"].lower() == raw.lower()]
        if not matches:
            print(colour(f"  No task named '{raw}' found.", YELLOW))
            return
        target = matches[0]

    confirm = input(colour(
        f"  Delete '{target['name']}'? (y/n): ", YELLOW
    )).strip().lower()

    if confirm == "y":
        tasks.remove(target)
        save_tasks(tasks)
        print(colour(f"  ✓ '{target['name']}' deleted.", GREEN))
    else:
        print("  Cancelled.")


def mark_completed(tasks: list) -> None:
    """Toggle the completed flag on a task instead of deleting it."""
    active = [t for t in tasks if not t["completed"]]
    if not active:
        print(colour("  No active tasks.", DIM))
        return

    view_tasks(tasks)
    print(colour("\n── Mark Task Complete ────────────────────────", CYAN))
    raw = input("  Enter task name or number: ").strip()

    target = None

    if raw.isdigit():
        idx = int(raw) - 1
        ordered = sorted_tasks(active)
        if 0 <= idx < len(ordered):
            target = ordered[idx]
        else:
            print(colour("  Invalid number.", YELLOW))
            return
    else:
        matches = [t for t in tasks if t["name"].lower() == raw.lower()
                   and not t["completed"]]
        if not matches:
            print(colour(f"  No active task named '{raw}'.", YELLOW))
            return
        target = matches[0]

    target["completed"] = True
    save_tasks(tasks)
    print(colour(f"  ✓ '{target['name']}' marked as completed.", GREEN))


def view_completed(tasks: list) -> None:
    completed = [t for t in tasks if t["completed"]]
    if not completed:
        print(colour("  No completed tasks yet.", DIM))
        return
    print(colour(f"\n  {len(completed)} completed task(s):", CYAN))
    for t in completed:
        print(colour(f"    ✓ {t['name']}", GREEN))

# ── Menu ──────────────────────────────────────────────────────────────────────

def print_banner() -> None:
    print(colour("""
  ╔══════════════════════════════════════════╗
  ║        Smart Study Assistant  📚         ║
  ╚══════════════════════════════════════════╝
""", CYAN))


def print_menu(tasks: list) -> None:
    active = sum(1 for t in tasks if not t["completed"])
    done   = sum(1 for t in tasks if t["completed"])
    print(colour(f"\n  Active tasks: {active}  |  Completed: {done}", DIM))
    print(colour("""
  ┌─────────────────────────────────────┐
  │  1  Add a task                      │
  │  2  View tasks                      │
  │  3  Mark task as completed          │
  │  4  Delete a task                   │
  │  5  View completed tasks            │
  │  6  Exit                            │
  └─────────────────────────────────────┘""", WHITE))


def run() -> None:
    tasks = load_tasks()
    print_banner()

    if tasks:
        print(colour(f"  Loaded {len(tasks)} task(s) from '{SAVE_FILE}'.", GREEN))

    while True:
        print_menu(tasks)
        choice = input(colour("  Your choice (1-6): ", CYAN)).strip()

        if choice == "1":
            add_task(tasks)
        elif choice == "2":
            view_tasks(tasks)
        elif choice == "3":
            mark_completed(tasks)
        elif choice == "4":
            delete_task(tasks)
        elif choice == "5":
            view_completed(tasks)
        elif choice == "6":
            save_tasks(tasks)
            print(colour("\n  Tasks saved. Goodbye! 👋\n", GREEN))
            break
        else:
            print(colour("  Invalid choice — please enter a number from 1 to 6.", YELLOW))


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    run()


# =============================================================================
# HOW THE PRIORITY SYSTEM WORKS
# =============================================================================
#
# Each task receives a numeric priority score calculated by:
#
#   priority = (importance * 3) + (difficulty * 2) + (10 - deadline)
#
#   • importance * 3  — the most heavily weighted factor; tasks that matter
#                        most to the user's goals rise to the top.
#   • difficulty * 2  — harder tasks are prioritised so they aren't left
#                        until the last moment.
#   • (10 - deadline) — converts deadline (days away) into urgency; a task
#                        due in 1 day scores 9, one due in 10 days scores 0.
#
# Score tiers displayed with colour coding:
#   HIGH  ≥ 35  (red)    — do these first
#   MED   20–34 (yellow) — schedule soon
#   LOW   < 20  (green)  — lower urgency
#
# =============================================================================
# WHY THIS IS A RULE-BASED AI / DECISION-MAKING SYSTEM
# =============================================================================
#
# This is a classic *rule-based expert system* — one of the earliest forms of
# AI (1960s–1980s). Instead of learning from data, it encodes human expertise
# as explicit IF-THEN rules or weighted formulas:
#
#   "If a task is important AND difficult AND due soon → high priority."
#
# The weights (×3, ×2, +urgency) represent expert knowledge about how these
# factors interact when studying. The system makes decisions (what to study
# next) automatically without the user needing to rank tasks manually.
#
# =============================================================================
# HOW IT COULD BE IMPROVED WITH MACHINE LEARNING
# =============================================================================
#
# 1. Personalised weights — instead of fixed multipliers, a model could learn
#    your weighting preferences from your past behaviour (which tasks you
#    actually completed first).
#
# 2. Adaptive deadlines — a regression model could predict how long tasks
#    actually take you based on past difficulty scores and actual completion
#    times, adjusting deadlines automatically.
#
# 3. Natural language input — an NLP model (e.g. fine-tuned LLM) could infer
#    importance and difficulty directly from a plain-English task description,
#    removing the need for manual scoring.
#
# 4. Reinforcement learning — the system could observe which study order
#    maximises your performance (e.g. test scores) and iteratively refine the
#    priority formula over time.
# =============================================================================
