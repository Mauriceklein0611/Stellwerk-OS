import type { AgentService } from "@/lib/agent-service";
import type {
  AgentRun,
  Backlog,
  PipelineHooks,
  PipelineResult,
  ProjectArtifacts,
  ProjectDraft,
  ProjectIdea,
  Requirements,
  RiskRegister,
} from "@/types";
import {
  buildBacklog,
  buildDraft,
  buildRequirements,
  buildRiskRegister,
} from "@/data/mock-templates";

type MockOptions = {
  /** Artificial latency per agent step (ms). Set to 0 in tests. */
  delayMs?: number;
};

/**
 * Deterministic, in-memory implementation of AgentService. Produces
 * schema-conform artifacts from the idea and simulates latency/status so the
 * UI behaves like the real pipeline will.
 */
export class MockAgentService implements AgentService {
  private readonly delayMs: number;

  constructor(options: MockOptions = {}) {
    this.delayMs = options.delayMs ?? 1200;
  }

  private async simulate(): Promise<void> {
    if (this.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    }
  }

  async runDraft(idea: ProjectIdea): Promise<ProjectDraft> {
    await this.simulate();
    return buildDraft(idea);
  }

  async runRequirements(draft: ProjectDraft): Promise<Requirements> {
    await this.simulate();
    return buildRequirements(draft);
  }

  async runScrum(requirements: Requirements): Promise<Backlog> {
    await this.simulate();
    return buildBacklog(requirements);
  }

  async runRisk(draft: ProjectDraft, backlog: Backlog): Promise<RiskRegister> {
    await this.simulate();
    return buildRiskRegister(draft, backlog);
  }

  async runPipeline(
    idea: ProjectIdea,
    hooks?: PipelineHooks,
  ): Promise<PipelineResult> {
    const runs: AgentRun[] = [];
    const record = (agent: string) => {
      const run: AgentRun = {
        id: crypto.randomUUID(),
        agent,
        project: idea.name,
        status: "success",
        timestamp: new Date().toISOString(),
      };
      runs.push(run);
      hooks?.onRun?.(run);
    };

    hooks?.onStatus?.("Erstelle Projektentwurf …");
    const draft = await this.runDraft(idea);
    record("Draft-Agent");

    hooks?.onStatus?.("Leite Requirements ab …");
    const requirements = await this.runRequirements(draft);
    record("Requirements-Agent");

    hooks?.onStatus?.("Erzeuge Backlog & Stories …");
    const backlog = await this.runScrum(requirements);
    record("Scrum-Agent");

    hooks?.onStatus?.("Analysiere Risiken …");
    const risks = await this.runRisk(draft, backlog);
    record("Risk-Agent");

    hooks?.onStatus?.("Pipeline abgeschlossen.");

    const artifacts: ProjectArtifacts = { draft, requirements, backlog, risks };
    return { artifacts, runs };
  }
}
