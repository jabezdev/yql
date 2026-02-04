# System Architecture

## 🌟 Philosophy: The "Hyper-Flexible" Platform

`yql` is not just a hardcoded HR app. It is an **Engine-Driven Platform** designed to adapt.
Instead of writing 50 different "Forms" for Recruitment, Leave, Onboarding, etc., we built **One Engine** that can run *any* process defined by an Admin.

**Key Principle**: *Code the tool builder, not the tool.*

---

## 🏗 Tech Stack

-   **Backend**: [Convex](https://convex.dev) - Real-time Database & Backend-as-a-Service (BaaS).
-   **Frontend**: React + Vite + TypeScript.
-   **Styling**: TailwindCSS.
-   **State**: Convex (Server State), React Context (Local Auth).

---

## 📂 Vertical Slice Architecture

The codebase is organized into three distinct layers to manage complexity. This structure is mirrored in `src/` (Frontend) and `convex/` (Backend).

```mermaid
graph TD
    subgraph "Your Codebase"
        D[Domains (Specifics)]
        E[Engine (Generic)]
        C[Core (Shared)]
    end
    
    D --> E
    D --> C
    E --> C
```

### 1. Core (`/core`)
**The Foundation.** Platform-agnostic utilities shared by everyone.
-   **Auth**: Session handling, `RoleGuard`, `useCurrentUser`.
-   **UI**: Generic components (`Button`, `Card`, `Modal`).
-   **Audit**: `createAuditLog` (Legal trail for everything).

### 2. Engine (`/engine`)
**The Workflow Machine.** The generic logic that powers 80% of the app.
-   **Programs (`programs.ts`)**: Configuration "Classes" (e.g., "Onboarding 2026").
-   **Processes (`processes.ts`)**: State "Instances" (e.g., "Jane's Onboarding").
-   **Automations (`automations.ts`)**: The Event Bus.
-   **Blocks**: `InputText`, `FileUpload`, `Signature` logic.

### 3. Domains (`/domains`)
**The Business Logic.** Specialized features that don't fit the generic engine.
-   **HR**: Performance Reviews, Goals, Promotions (Complex logic).
-   **Ops**: Events, Inventory, Finance (Data-heavy).
-   **Admin**: The interfaces to configure the Engine.

---

## ⚙️ The Process Engine Model

Understanding this model is critical for working on the backend.

### The Hierarchy
1.  **Program**: The configuration object. Contains `StageDefs` and `Automations`.
2.  **Process**: The runtime object. Linked to ONE User and ONE Program.
3.  **Stage**: A step in the Process. Contains `BlockInstances`.
4.  **Block**: An atomic unit of UI/Data (e.g., "Grades Upload").

### Data Flow Example: "Applying for a Job"
1.  **User** submits data to `submitStage` mutation.
2.  **Engine** validates data against `BlockConfig`.
3.  **Engine** calculates `nextStageId`.
4.  **Engine** emits an event: `stage_submission`.
5.  **Automation Engine** catches event -> Runs Actions (e.g., "Send Email").

---

## ⚡ Automations Architecture (Event-Driven)

We moved away from hardcoded "Side Effects" (e.g., `if (accepted) user.role = member`) to a data-driven model.

### How it works
1.  **Trigger**: A Mutation (like `acceptOffer` or `bookEvent`) emits a trigger string (e.g., `offer_accepted`).
2.  **Evaluate**: `automations.evaluate` (internal action) is scheduled.
3.  **Config Lookup**: It looks at the `Program.automations` array.
4.  **Execution**: matching Actions are executed.

**Supported Triggers**:
-   `process_created`
-   `stage_submission`
-   `status_change`
-   `offer_accepted`
-   `event_booked`

**Supported Actions**:
-   `update_role`
-   `update_status`
-   `send_email`

---

## 🔒 Security & RBAC (Matrix Model)

Security is handled at three levels:

1.  **System Role** (`users.systemRole`):
    -   `admin`: God mode.
    -   `guest`: Public access.
    -   `member`: Basic internal access.

2.  **Context Role** (Program-Level):
    -   Defined in `Program.accessControl`.
    -   *Example*: A "Member" allows to *Start* a "Leave Request" but cannot *View* "Performance Reviews".

3.  **Relationship Role** (Matrix):
    -   `manager_assignments` table.
    -   Checks: "Is User A the direct manager of User B?"

**Best Practice**: Always use `getViewer(ctx)` and helper guards like `ensureReviewer(ctx)` in your mutations.

---

## 👩‍💻 Developer Guide: "Where do I put my code?"

| Scenario | Location | Example |
| :--- | :--- | :--- |
| **"I need a reusable React Button"** | `src/core/ui` | `Button.tsx` |
| **"I need a new type of form field"** | `src/engine/blocks` | `AudioRecorder.tsx` |
| **"I need to query all Users"** | `convex/core/users.ts` | `getAllUsers` |
| **"I need a Payroll module"** | `src/domains/finance` | `Payroll.tsx` |
| **"I need to fix the Application Logic"** | `convex/engine/processes.ts` | `submitStage` |

### Adding a New Feature
1.  **Can the Engine do it?** (Can I just configure a Program?) -> **Do that.**
2.  **Can the Engine almost do it?** (Do I need a new Block type?) -> **Extend Engine.**
3.  **Is it totally custom?** (e.g., Interactive Calendar) -> **Build in Domain.**
